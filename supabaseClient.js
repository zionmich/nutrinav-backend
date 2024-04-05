require("dotenv").config({ path: '/Users/zionm/nutriNav2/.env' });

const { createClient } = require('@supabase/supabase-js');

const client = createClient("https://iypnuqzdeqeenutmzenq.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5cG51cXpkZXFlZW51dG16ZW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY0MjM5MDgsImV4cCI6MjAyMTk5OTkwOH0.hJp0l9-AsfBKrrwbW1_5onaQ63pXMK68awewEbdgm4g");

const supabaseClient = () => client; 

module.exports = supabaseClient;