import { google } from 'googleapis';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { tenants } from '@/db/schema/tenants';
import { env } from '@/config/env';

export async function addEventToCalendar(tenantId: string, appointmentDetails: { title: string, description: string, startTime: Date, endTime: Date }): Promise<string | false> {
  try {
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant || !tenant.googleCalendarToken) {
      console.log('Google Calendar not connected for tenant.');
      return false;
    }

    const tokens = JSON.parse(tenant.googleCalendarToken);
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: appointmentDetails.title,
      description: appointmentDetails.description,
      start: {
        dateTime: appointmentDetails.startTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: appointmentDetails.endTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    console.log('Event created: %s', res.data.htmlLink);
    return res.data.id || false;
  } catch (error) {
    console.error('Failed to create event in Google Calendar', error);
    return false;
  }
}

export async function deleteEventFromCalendar(tenantId: string, eventId: string): Promise<boolean> {
  try {
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant || !tenant.googleCalendarToken) return false;

    const tokens = JSON.parse(tenant.googleCalendarToken);
    const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return true;
  } catch (error) {
    console.error('Failed to delete event from Google Calendar', error);
    return false;
  }
}

export async function updateEventInCalendar(tenantId: string, eventId: string, appointmentDetails: { title?: string, description?: string, startTime?: Date, endTime?: Date }): Promise<boolean> {
  try {
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
    if (!tenant || !tenant.googleCalendarToken) return false;

    const tokens = JSON.parse(tenant.googleCalendarToken);
    const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Buscar evento atual para fazer patch
    const eventPatch: any = {};
    if (appointmentDetails.title) eventPatch.summary = appointmentDetails.title;
    if (appointmentDetails.description) eventPatch.description = appointmentDetails.description;
    if (appointmentDetails.startTime) {
      eventPatch.start = { dateTime: appointmentDetails.startTime.toISOString(), timeZone: 'America/Sao_Paulo' };
    }
    if (appointmentDetails.endTime) {
      eventPatch.end = { dateTime: appointmentDetails.endTime.toISOString(), timeZone: 'America/Sao_Paulo' };
    }

    await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: eventPatch,
    });

    return true;
  } catch (error) {
    console.error('Failed to update event in Google Calendar', error);
    return false;
  }
}

export async function syncAppointmentToCalendar(appointmentId: string): Promise<boolean> {
  try {
    const { appointments, clients, services } = await import('@/db/schema');
    
    // Buscar o agendamento com os dados necessários
    const apts = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
    if (!apts.length) return false;
    
    const appointment = apts[0];
    if (appointment.googleEventId) return true; // Já sincronizado
    
    let clientName = 'Cliente desconhecido';
    let clientPhone = '';
    if (appointment.clientId) {
      const cls = await db.select().from(clients).where(eq(clients.id, appointment.clientId)).limit(1);
      if (cls.length) {
        clientName = cls[0].name || cls[0].whatsappName || 'Cliente sem nome';
        clientPhone = cls[0].phone || '';
      }
    }
    
    let duration = 60; // default 1h
    if (appointment.serviceId) {
      const srvs = await db.select().from(services).where(eq(services.id, appointment.serviceId)).limit(1);
      if (srvs.length && srvs[0].durationMinutes) {
        duration = srvs[0].durationMinutes;
      }
    }
    
    const startTime = new Date(appointment.date);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const title = `${appointment.serviceName} - ${clientName}`;
    const description = `Agendamento criado via AgendaZap.\nCliente: ${clientName}\nTelefone: ${clientPhone}\nServiço: ${appointment.serviceName}\nValor: R$ ${appointment.price}`;
    
    const eventId = await addEventToCalendar(appointment.tenantId, {
      title,
      description,
      startTime,
      endTime
    });

    if (eventId) {
      await db.update(appointments).set({ googleEventId: eventId }).where(eq(appointments.id, appointmentId));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to sync appointment to calendar', error);
    return false;
  }
}

export async function unsyncAppointmentFromCalendar(appointmentId: string): Promise<boolean> {
  try {
    const { appointments } = await import('@/db/schema');
    const apts = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
    if (!apts.length || !apts[0].googleEventId) return false;
    
    const success = await deleteEventFromCalendar(apts[0].tenantId, apts[0].googleEventId);
    if (success) {
      // Remove a referência do banco
      await db.update(appointments).set({ googleEventId: null }).where(eq(appointments.id, appointmentId));
    }
    return success;
  } catch (error) {
    console.error('Failed to unsync appointment from calendar', error);
    return false;
  }
}
