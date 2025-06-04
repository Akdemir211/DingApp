-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    photo_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create watch_room_participants table if not exists  
CREATE TABLE IF NOT EXISTS public.watch_room_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid NOT NULL REFERENCES public.watch_rooms(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at timestamp with time zone DEFAULT now(),
    UNIQUE(room_id, user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on watch_room_participants  
ALTER TABLE public.watch_room_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for watch_room_participants
CREATE POLICY "Users can view participants of accessible rooms" ON public.watch_room_participants
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.watch_rooms 
        WHERE id = watch_room_participants.room_id 
        AND (created_by = auth.uid() OR is_private = false)
    )
);

CREATE POLICY "Users can join accessible rooms" ON public.watch_room_participants
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.watch_rooms 
        WHERE id = room_id 
        AND (created_by = auth.uid() OR is_private = false)
    )
);

CREATE POLICY "Users can leave rooms they joined" ON public.watch_room_participants
FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, name)
  VALUES (new.id, new.id, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 