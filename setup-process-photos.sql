-- Script para configurar fotos do processo
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela para armazenar as fotos do processo
CREATE TABLE IF NOT EXISTS public.appointment_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('antes', 'durante', 'depois')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointment_photos_appointment_id ON public.appointment_photos(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_photos_phase ON public.appointment_photos(phase);
CREATE INDEX IF NOT EXISTS idx_appointment_photos_created_at ON public.appointment_photos(created_at);

-- 3. Configurar RLS (Row Level Security)
ALTER TABLE public.appointment_photos ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para appointment_photos
-- Permitir SELECT para usuários autenticados do mesmo salão
CREATE POLICY "Users can view appointment photos from their salon" ON public.appointment_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            JOIN public.users u ON a.salao_id = u.salao_id
            WHERE a.id = appointment_photos.appointment_id
            AND u.id = auth.uid()
        )
    );

-- Permitir INSERT para usuários autenticados do mesmo salão
CREATE POLICY "Users can insert appointment photos in their salon" ON public.appointment_photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.appointments a
            JOIN public.users u ON a.salao_id = u.salao_id
            WHERE a.id = appointment_photos.appointment_id
            AND u.id = auth.uid()
        )
    );

-- Permitir UPDATE para usuários autenticados do mesmo salão
CREATE POLICY "Users can update appointment photos in their salon" ON public.appointment_photos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            JOIN public.users u ON a.salao_id = u.salao_id
            WHERE a.id = appointment_photos.appointment_id
            AND u.id = auth.uid()
        )
    );

-- Permitir DELETE para usuários autenticados do mesmo salão
CREATE POLICY "Users can delete appointment photos in their salon" ON public.appointment_photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.appointments a
            JOIN public.users u ON a.salao_id = u.salao_id
            WHERE a.id = appointment_photos.appointment_id
            AND u.id = auth.uid()
        )
    );

-- 5. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger para atualizar updated_at
CREATE TRIGGER update_appointment_photos_updated_at 
    BEFORE UPDATE ON public.appointment_photos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Comentários para documentação
COMMENT ON TABLE public.appointment_photos IS 'Tabela para armazenar fotos do processo de atendimento (antes, durante, depois)';
COMMENT ON COLUMN public.appointment_photos.appointment_id IS 'ID do agendamento relacionado';
COMMENT ON COLUMN public.appointment_photos.photo_url IS 'URL da foto no Supabase Storage';
COMMENT ON COLUMN public.appointment_photos.phase IS 'Fase do processo: antes, durante, depois';
