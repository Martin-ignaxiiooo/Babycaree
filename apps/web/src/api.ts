// api.ts
export const API_URL = 'http://localhost:3000/api';

export interface BabyProfile {
  id: string;
  nombre: string;
  fecha_nacimiento: string;
  sexo: string;
  es_prematuro: boolean;
  semanas_gestacion: number | null;
}

export interface Vaccine {
  vacuna_id: number;
  nombre: string;
  enfermedades_previene: string;
  meses_edad_recomendada: number;
  aplicada: boolean;
  fecha_aplicacion: string | null;
  lugar_aplicacion: string | null;
}

export interface ProfileResponse {
  baby: BabyProfile;
  vacunas: Vaccine[];
}

export const fetchPublicProfile = async (id: string): Promise<ProfileResponse> => {
  const res = await fetch(`${API_URL}/profiles/public/${id}`);
  if (!res.ok) {
    throw new Error('No se pudo cargar el perfil del bebé');
  }
  return res.json();
};
