-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'profissional', 'cliente');
CREATE TYPE public.appointment_status AS ENUM ('pendente', 'confirmado', 'cancelado', 'concluido');

-- Salons table (tenants)
CREATE TABLE public.salons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'cliente',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT profiles_salon_required CHECK (
    (role = 'superadmin') OR (salon_id IS NOT NULL)
  )
);

-- Services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  tax_machine DECIMAL(5,2) DEFAULT 0,
  tax_product DECIMAL(5,2) DEFAULT 0,
  tax_other DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Professionals table (specializations and schedules)
CREATE TABLE public.professionals (
  id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  specialties TEXT[] DEFAULT '{}',
  schedule JSONB DEFAULT '{}', -- Store weekly schedule
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  final_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_salon_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT salon_id FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for salons
CREATE POLICY "Superadmins can manage all salons" ON public.salons
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'superadmin');

CREATE POLICY "Users can view their own salon" ON public.salons
  FOR SELECT TO authenticated
  USING (id = public.get_user_salon_id(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their salon" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'superadmin' OR
    salon_id = public.get_user_salon_id(auth.uid()) OR
    id = auth.uid()
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles in their salon" ON public.profiles
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'superadmin' OR
    (public.get_user_role(auth.uid()) = 'admin' AND salon_id = public.get_user_salon_id(auth.uid()))
  );

-- RLS Policies for services
CREATE POLICY "Users can view services in their salon" ON public.services
  FOR SELECT TO authenticated
  USING (salon_id = public.get_user_salon_id(auth.uid()));

CREATE POLICY "Admins can manage services in their salon" ON public.services
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'superadmin' OR
    (public.get_user_role(auth.uid()) = 'admin' AND salon_id = public.get_user_salon_id(auth.uid()))
  );

-- RLS Policies for professionals
CREATE POLICY "Users can view professionals in their salon" ON public.professionals
  FOR SELECT TO authenticated
  USING (salon_id = public.get_user_salon_id(auth.uid()));

CREATE POLICY "Admins can manage professionals in their salon" ON public.professionals
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'superadmin' OR
    (public.get_user_role(auth.uid()) = 'admin' AND salon_id = public.get_user_salon_id(auth.uid()))
  );

-- RLS Policies for appointments
CREATE POLICY "Users can view appointments in their salon" ON public.appointments
  FOR SELECT TO authenticated
  USING (salon_id = public.get_user_salon_id(auth.uid()));

CREATE POLICY "Clients can view their own appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Professionals can view their appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

CREATE POLICY "Clients can create appointments in their salon" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    salon_id = public.get_user_salon_id(auth.uid()) AND
    client_id = auth.uid()
  );

CREATE POLICY "Admins and professionals can manage appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'superadmin' OR
    (public.get_user_role(auth.uid()) IN ('admin', 'profissional') AND salon_id = public.get_user_salon_id(auth.uid()))
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_salons_updated_at
  BEFORE UPDATE ON public.salons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'cliente'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert default superadmin salon for initial setup
INSERT INTO public.salons (id, name, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'Sistema Administrativo', 'admin@sistema.com');