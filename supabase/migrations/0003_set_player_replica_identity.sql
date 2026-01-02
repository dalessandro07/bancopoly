-- Configurar replica identity full para la tabla player
-- Esto permite que Supabase Realtime envíe el registro completo en el campo 'old'
-- cuando se elimina un jugador
ALTER TABLE "player" REPLICA IDENTITY FULL;
