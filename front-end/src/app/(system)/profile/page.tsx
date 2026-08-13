"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, User, X, Camera, Eye, ArrowRight } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { formatPhone, formatCPF } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  
  const [profile, setProfile] = useState({ name: "", email: "", username: "", avatarUrl: "", phone: "", cpf: "", gender: "", socialName: "", birthDate: "", role: "" });
  const [receitaGender, setReceitaGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cpfValidating, setCpfValidating] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);

  // Email Change States
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stepEmail, setStepEmail] = useState<"input" | "otp">("input");
  
  // Phone Change States
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [stepPhone, setStepPhone] = useState<"input" | "otp">("input");
  
  // Password Change States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // PIN Change States
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const passReqs = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const passValid = Object.values(passReqs).every(Boolean) && newPassword === confirmPassword;

  useEffect(() => {
    async function loadData() {
      try {
        // Obter os headers de auth se necessário. Neste app, NextAuth com JWT pode precisar de token ou cookies já resolvem.
        // Assumindo que a sessão tem accessToken se necessário, mas geralmente os cookies cuidam disso.
        const token = (session?.user as any)?.accessToken;
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }

        const res = await fetch(getBackendUrl('/api/auth/profile'), { headers });
        const data = await res.json();
        if (data.success && data.data) {
          setProfile({
            name: data.data.name || "",
            email: data.data.email || "",
            username: data.data.username || "",
            avatarUrl: data.data.avatarUrl || "",
            phone: data.data.phone || "",
            cpf: data.data.cpf || "",
            gender: data.data.gender || "",
            socialName: data.data.socialName || "",
            birthDate: data.data.birthDate || "",
            role: data.data.role || ""
          });
          if (data.data.gender) {
            setReceitaGender(data.data.gender); // We store what came from DB initially so it doesn't hide immediately
          }
        }
      } catch (err) {
        toast.error("Erro ao carregar dados do perfil");
      } finally {
        setLoading(false);
      }
    }
    if (session) {
      loadData();
    }
  }, [session]);

  const authHeaders = (isUpload = false) => {
    const token = (session?.user as any)?.accessToken;
    const headers: any = {};
    if (!isUpload) headers['Content-Type'] = 'application/json';
    if (token) { headers['Authorization'] = `Bearer ${token}`; headers['x-authorization'] = `Bearer ${token}`; }
    return headers;
  };

  const saveName = async () => {
    if (!profile.name) return toast.error("O nome não pode ficar em branco.");
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl('/api/auth/profile'), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ 
          name: profile.name,
          username: profile.username,
          avatarUrl: newAvatarUrl || profile.avatarUrl,
          cpf: profile.cpf,
          gender: profile.gender,
          socialName: profile.socialName,
          birthDate: profile.birthDate
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success("Perfil atualizado com sucesso!");
          update({ name: profile.name, picture: newAvatarUrl || profile.avatarUrl });
          if (newAvatarUrl) {
            setProfile(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
            setNewAvatarUrl(null);
          }
        } else {
          toast.error(data.error || "Erro ao atualizar perfil.");
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao atualizar perfil.");
      }
    } catch (e) {
      toast.error("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const requestEmailChange = async () => {
    if (!newEmail || newEmail === profile.email) return toast.error("Insira um novo e-mail válido.");
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl('/api/auth/profile/request-email-change'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ newEmail })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Código enviado para o novo e-mail!");
        setStepEmail("otp");
      } else {
        toast.error(data.error || "Erro ao solicitar troca de e-mail.");
      }
    } catch (e) {
      toast.error("Erro na solicitação.");
    } finally {
      setSaving(false);
    }
  };

  const confirmEmailChange = async () => {
    if (!otp) return toast.error("Insira o código de confirmação.");
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl('/api/auth/profile/confirm-email-change'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ otp, newEmail })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("E-mail atualizado com sucesso!");
        setProfile({ ...profile, email: newEmail });
        setStepEmail("input");
        setNewEmail("");
        setOtp("");
        update({ email: newEmail });
      } else {
        toast.error(data.error || "Código inválido ou expirado.");
      }
    } catch (e) {
      toast.error("Erro na confirmação.");
    } finally {
      setSaving(false);
    }
  };

  const requestPhoneChange = async () => {
    let normNew = newPhone.replace(/\D/g, '');
    if (normNew.length > 11 && normNew.startsWith('55')) normNew = normNew.substring(2);
    
    let normOld = profile.phone.replace(/\D/g, '');
    if (normOld.length > 11 && normOld.startsWith('55')) normOld = normOld.substring(2);
    
    if (!normNew || normNew.length < 10 || normNew === normOld) {
      return toast.error("Insira um novo telefone válido e diferente do atual.");
    }
    
    if (!phonePassword) {
      return toast.error("Insira sua senha atual para confirmar a alteração.");
    }
    
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl('/api/auth/profile/request-phone-change'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ newPhone, currentPassword: phonePassword })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Código enviado via WhatsApp!");
        setStepPhone("otp");
      } else {
        toast.error(data.error || "Erro ao solicitar troca de telefone.");
      }
    } catch (e) {
      toast.error("Erro na solicitação.");
    } finally {
      setSaving(false);
    }
  };

  const confirmPhoneChange = async () => {
    if (!phoneOtp) return toast.error("Insira o código de confirmação.");
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl('/api/auth/profile/confirm-phone-change'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ otp: phoneOtp, newPhone })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Telefone atualizado com sucesso!");
        setProfile({ ...profile, phone: newPhone });
        setStepPhone("input");
        setNewPhone("");
        setPhoneOtp("");
        setPhonePassword("");
      } else {
        toast.error(data.error || "Código inválido ou expirado.");
      }
    } catch (e) {
      toast.error("Erro na confirmação.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!passValid || !currentPassword) return toast.error("Preencha as senhas corretamente.");
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl('/api/auth/profile/password'), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Senha atualizada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "A senha atual está incorreta.");
      }
    } catch (e) {
      toast.error("Erro ao atualizar senha.");
    } finally {
      setSaving(false);
    }
  };

  const savePin = async () => {
    if (newPin.length !== 6 || confirmPin.length !== 6) return toast.error("O PIN deve ter exatos 6 dígitos numéricos.");
    if (newPin !== confirmPin) return toast.error("Os novos PINs não coincidem.");
    
    setSaving(true);
    try {
      const res = await fetch(getBackendUrl('/api/auth/profile/pin'), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ currentPin, newPin })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("PIN de segurança atualizado com sucesso!");
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      } else {
        toast.error(data.error || "O PIN atual está incorreto.");
      }
    } catch (e) {
      toast.error("Erro ao atualizar PIN.");
    } finally {
      setSaving(false);
    }
  };


  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando perfil...</div>;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const toastId = toast.loading("Enviando imagem...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatar");

      try {
        const res = await fetch(getBackendUrl('/api/upload'), {
          method: 'POST',
          headers: authHeaders(true),
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          if (newAvatarUrl) {
            await fetch(getBackendUrl('/api/upload'), {
              method: 'DELETE',
              headers: { ...authHeaders(true), 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: newAvatarUrl })
            });
          }
          setNewAvatarUrl(data.url);
          toast.success("Imagem enviada! Clique em Salvar Alterações para confirmar.", { id: toastId });
        } else {
          toast.error(data.error || "Erro ao fazer upload.", { id: toastId });
        }
      } catch (err) {
        toast.error("Erro na conexão", { id: toastId });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">


      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="dados"><User className="w-4 h-4 mr-2" /> Dados Pessoais</TabsTrigger>
          <TabsTrigger value="seguranca"><ShieldCheck className="w-4 h-4 mr-2" /> Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Estes dados serão usados para identificar você no sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-8 p-6 bg-muted/30 rounded-2xl border border-border/50">
                  
                  {/* Container Atual */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative group w-32 h-32 rounded-full border-4 border-background shadow-md overflow-hidden bg-muted flex items-center justify-center transition-all hover:shadow-lg">
                      {profile.avatarUrl ? (
                        <img src={`/api/image-proxy?url=${encodeURIComponent(profile.avatarUrl)}`} alt="Avatar Atual" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-muted-foreground/50" />
                      )}
                      
                      {/* Hover Overlay para Alterar */}
                      <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Alterar</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      {profile.avatarUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => setViewImage(profile.avatarUrl)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Visualizar
                        </Button>
                      )}
                    </div>
                  </div>

                  {newAvatarUrl && (
                    <>
                      <div className="hidden sm:flex text-muted-foreground/30">
                        <ArrowRight className="w-8 h-8" />
                      </div>
                      
                      {/* Container Nova Foto */}
                      <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-left-4">
                        <div className="relative group w-32 h-32 rounded-full border-4 border-emerald-500 shadow-lg overflow-hidden bg-emerald-500/10 flex items-center justify-center ring-4 ring-emerald-500/20">
                          <img src={`/api/image-proxy?url=${encodeURIComponent(newAvatarUrl)}`} alt="Novo Avatar" className="w-full h-full object-cover" />
                          
                          {/* Hover Overlay para Visualizar a Nova */}
                          <div 
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                            onClick={() => setViewImage(newAvatarUrl)}
                          >
                            <Eye className="w-6 h-6" />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-8 text-xs font-semibold shadow-sm"
                            onClick={async () => {
                              if (newAvatarUrl) {
                                await fetch(getBackendUrl('/api/upload'), {
                                  method: 'DELETE',
                                  headers: { ...authHeaders(true), 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ url: newAvatarUrl })
                                });
                              }
                              setNewAvatarUrl(null);
                            }}
                          >
                            Descartar Nova Foto
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {!newAvatarUrl && (
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-semibold text-foreground mb-1">Foto de Perfil</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Clique na imagem para enviar uma nova foto. Recomendamos imagens quadradas (ex: 256x256px) em formato JPG ou PNG.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          value={formatCPF(profile.cpf)} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                            setProfile(p => ({ ...p, cpf: val }));
                          }} 
                          placeholder="000.000.000-00" 
                          maxLength={14}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        disabled={profile.cpf.length !== 11 || cpfValidating}
                        onClick={async () => {
                          setCpfValidating(true);
                          try {
                            const res = await fetch(getBackendUrl(`/api/validate/cpf?cpf=${profile.cpf}`));
                            const data = await res.json();
                            if (res.ok && data.success) {
                              if (!data.data) {
                                toast.error("Por favor, configure sua API Key no .env do Backend.");
                                return;
                              }
                              const apiPayload = data.data?.data || data.data; // Handles { data: { ... } } or direct
                              const newGender = apiPayload?.genero === 'M' ? 'Masculino' : apiPayload?.genero === 'F' ? 'Feminino' : apiPayload?.genero || profile.gender;
                              setReceitaGender(newGender);
                              
                              // Format YYYY-MM-DD to DD/MM/YYYY if needed
                              let birth = apiPayload?.data_nascimento || apiPayload?.nascimento || profile.birthDate;
                              if (birth && birth.includes('-') && birth.length === 10) {
                                const [y, m, d] = birth.split('-');
                                birth = `${d}/${m}/${y}`;
                              }

                              setProfile(p => ({
                                ...p,
                                name: apiPayload?.nome || p.name,
                                gender: newGender,
                                birthDate: birth
                              }));
                              toast.success("Dados preenchidos pela Receita Federal");
                            } else {
                              toast.error(data.error || "CPF não encontrado na base");
                            }
                          } catch(e) {
                            toast.error("Erro ao validar CPF");
                          } finally {
                            setCpfValidating(false);
                          }
                        }}
                      >
                        {cpfValidating ? "Validando..." : "Validar"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nome de Usuário (Único)</Label>
                    <Input value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} placeholder="ex: joao.silva" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nome Completo (Receita)</Label>
                    <Input 
                      value={profile.name} 
                      onChange={e => setProfile({...profile, name: e.target.value})} 
                      readOnly={!!profile.cpf && profile.cpf.length === 11}
                      className={!!profile.cpf && profile.cpf.length === 11 ? "bg-muted text-muted-foreground" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input 
                      value={profile.birthDate} 
                      onChange={e => setProfile({...profile, birthDate: e.target.value})} 
                      readOnly={!!profile.cpf && profile.cpf.length === 11}
                      className={!!profile.cpf && profile.cpf.length === 11 ? "bg-muted text-muted-foreground" : ""}
                      placeholder="DD/MM/AAAA"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gênero</Label>
                    <Select 
                      value={profile.gender} 
                      onValueChange={val => setProfile({...profile, gender: val || ""})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(profile.gender === 'Outro' || (receitaGender && profile.gender !== receitaGender)) && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label>Nome Social (Opcional)</Label>
                      <Input 
                        value={profile.socialName} 
                        onChange={e => setProfile({...profile, socialName: e.target.value})} 
                        placeholder="Como prefere ser chamado(a)"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-6">
                <Button onClick={saveName} disabled={saving || !profile.name}>{saving ? "Salvando..." : "Salvar Alterações"}</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereço de E-mail</CardTitle>
                <CardDescription>O e-mail usado para acessar sua conta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Label>E-mail Atual</Label>
                  <Input value={profile.email} readOnly className="bg-muted text-muted-foreground" />
                </div>
                
                {stepEmail === "input" && (
                  <div className="space-y-2 pt-4 border-t border-dashed">
                    <Label>Deseja alterar o e-mail?</Label>
                    <Input 
                      placeholder="Novo endereço de e-mail" 
                      value={newEmail} 
                      onChange={e => setNewEmail(e.target.value)} 
                    />
                  </div>
                )}

                {stepEmail === "otp" && (
                  <div className="space-y-2 pt-4 border-t border-dashed">
                    <Label>Código de Confirmação</Label>
                    <div className="text-xs text-muted-foreground mb-2">Enviamos um código para {newEmail}.</div>
                    <Input 
                      placeholder="Ex: 123456" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value)} 
                      maxLength={6}
                    />
                    <Button variant="link" className="px-0 h-auto text-xs" onClick={() => setStepEmail("input")}>Cancelar e usar outro e-mail</Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t p-6">
                {stepEmail === "input" ? (
                  <Button onClick={requestEmailChange} disabled={saving || !newEmail || newEmail === profile.email}>
                    Solicitar Alteração
                  </Button>
                ) : (
                  <Button onClick={confirmEmailChange} disabled={saving || otp.length < 6}>
                    Confirmar Código
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Telefone (WhatsApp)</CardTitle>
                <CardDescription>O telefone usado para alertas e validação de segurança via WhatsApp.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Label>Telefone Atual</Label>
                  <Input value={formatPhone(profile.phone)} readOnly className="bg-muted text-muted-foreground" />
                </div>
                
                {stepPhone === "input" && (
                  <div className="space-y-4 pt-4 border-t border-dashed">
                    <div className="space-y-2">
                      <Label>Deseja alterar o telefone?</Label>
                      <Input 
                        placeholder="+55 (11) 9 9999-9999" 
                        value={newPhone} 
                        onChange={e => setNewPhone(formatPhone(e.target.value))} 
                        maxLength={21}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Senha Atual</Label>
                      <Input 
                        type="password"
                        placeholder="Digite sua senha para confirmar" 
                        value={phonePassword} 
                        onChange={e => setPhonePassword(e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                {stepPhone === "otp" && (
                  <div className="space-y-2 pt-4 border-t border-dashed">
                    <Label>Código de Confirmação</Label>
                    <div className="text-xs text-muted-foreground mb-2">Enviamos um código via WhatsApp para {newPhone}.</div>
                    <Input 
                      placeholder="Ex: 123456" 
                      value={phoneOtp} 
                      onChange={e => setPhoneOtp(e.target.value)} 
                      maxLength={6}
                    />
                    <Button variant="link" className="px-0 h-auto text-xs" onClick={() => setStepPhone("input")}>Cancelar e usar outro número</Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t p-6">
                {stepPhone === "input" ? (
                  <Button 
                    onClick={requestPhoneChange} 
                    disabled={
                      saving || 
                      !newPhone || 
                      !phonePassword ||
                      newPhone.replace(/\D/g, '') === profile.phone.replace(/\D/g, '') ||
                      (newPhone.replace(/\D/g, '').length > 11 && newPhone.replace(/\D/g, '').startsWith('55') ? newPhone.replace(/\D/g, '').substring(2) : newPhone.replace(/\D/g, '')) === 
                      (profile.phone.replace(/\D/g, '').length > 11 && profile.phone.replace(/\D/g, '').startsWith('55') ? profile.phone.replace(/\D/g, '').substring(2) : profile.phone.replace(/\D/g, ''))
                    }
                  >
                    Solicitar Alteração
                  </Button>
                ) : (
                  <Button onClick={confirmPhoneChange} disabled={saving || phoneOtp.length < 6}>
                    Confirmar Código
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <Card>
              <CardHeader>
                <CardTitle>Alteração de Senha</CardTitle>
                <CardDescription>Para garantir sua segurança, solicitamos a senha atual.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                </div>
                
                <div className="space-y-2 border-t pt-4">
                  <Label>Nova Senha</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  <div className="grid grid-cols-1 gap-2 mt-3 p-3 bg-muted/50 rounded-lg border text-xs">
                    <div className={`flex items-center gap-1.5 ${passReqs.length ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                      <CheckCircle2 className="w-3 h-3" /> Mín. 8 caracteres
                    </div>
                    <div className={`flex items-center gap-1.5 ${passReqs.upper ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                      <CheckCircle2 className="w-3 h-3" /> Letra maiúscula
                    </div>
                    <div className={`flex items-center gap-1.5 ${passReqs.lower ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                      <CheckCircle2 className="w-3 h-3" /> Letra minúscula
                    </div>
                    <div className={`flex items-center gap-1.5 ${passReqs.number ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                      <CheckCircle2 className="w-3 h-3" /> Pelo menos um número
                    </div>
                    <div className={`flex items-center gap-1.5 ${passReqs.special ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                      <CheckCircle2 className="w-3 h-3" /> Caractere especial (!@#$%)
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 font-medium mt-1">As senhas não coincidem.</p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> As senhas coincidem.</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-6">
                <Button onClick={savePassword} disabled={saving || !passValid || !currentPassword}>
                  {saving ? "Atualizando..." : "Atualizar Senha"}
                </Button>
              </CardFooter>
            </Card>

            {profile?.role === "SUPERADMIN" && (
              <Card>
                <CardHeader>
                  <CardTitle>PIN de Segurança</CardTitle>
                  <CardDescription>O PIN de 6 dígitos é exigido para acessar configurações avançadas de Superadmin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>PIN Atual</Label>
                    <Input 
                      type="password" 
                      maxLength={6} 
                      placeholder="******" 
                      value={currentPin} 
                      onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))} 
                    />
                  </div>
                  
                  <div className="space-y-2 border-t pt-4">
                    <Label>Novo PIN</Label>
                    <Input 
                      type="password" 
                      maxLength={6} 
                      placeholder="Apenas 6 números" 
                      value={newPin} 
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Confirmar Novo PIN</Label>
                    <Input 
                      type="password" 
                      maxLength={6} 
                      placeholder="Repita os 6 números" 
                      value={confirmPin} 
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} 
                    />
                    {confirmPin && newPin !== confirmPin && (
                      <p className="text-xs text-red-500 font-medium mt-1">Os PINs não coincidem.</p>
                    )}
                    {confirmPin.length === 6 && newPin === confirmPin && (
                      <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> PIN válido.</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t p-6">
                  <Button onClick={savePin} disabled={saving || newPin.length !== 6 || newPin !== confirmPin || !currentPin}>
                    {saving ? "Atualizando..." : "Atualizar PIN"}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização de Imagem */}
      {viewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setViewImage(null)}
        >
          <div className="relative max-w-3xl w-full flex flex-col items-center justify-center">
            <button 
              onClick={() => setViewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={`/api/image-proxy?url=${encodeURIComponent(viewImage)}`} 
              alt="Visualização" 
              className="w-auto h-auto max-h-[80vh] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
