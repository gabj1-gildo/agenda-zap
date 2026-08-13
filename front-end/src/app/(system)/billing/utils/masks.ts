export const maskCardNumber = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 16) v = v.substring(0, 16);
  v = v.replace(/(\d{4})/g, "$1 ").trim();
  return v;
};

export const maskCardExpiry = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 4) v = v.substring(0, 4);
  if (v.length > 2) v = `${v.substring(0, 2)}/${v.substring(2)}`;
  return v;
};

export const maskCep = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 8) v = v.substring(0, 8);
  if (v.length > 5) v = `${v.substring(0, 5)}-${v.substring(5)}`;
  return v;
};

export const maskDocument = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 14) v = v.substring(0, 14);
  if (v.length <= 11) {
    if (v.length > 3) v = `${v.substring(0, 3)}.${v.substring(3)}`;
    if (v.length > 7) v = `${v.substring(0, 7)}.${v.substring(7)}`;
    if (v.length > 11) v = `${v.substring(0, 11)}-${v.substring(11)}`;
  } else {
    if (v.length > 2) v = `${v.substring(0, 2)}.${v.substring(2)}`;
    if (v.length > 6) v = `${v.substring(0, 6)}.${v.substring(6)}`;
    if (v.length > 10) v = `${v.substring(0, 10)}/${v.substring(10)}`;
    if (v.length > 15) v = `${v.substring(0, 15)}-${v.substring(15)}`;
  }
  return v;
};

export const maskPhone = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
  if (v.length > 9) v = `${v.substring(0, 9)}-${v.substring(9)}`;
  return v;
};
