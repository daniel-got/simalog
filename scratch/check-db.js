import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envText = fs.readFileSync(".env", "utf-8");
const env = {};
envText.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim().replace(/^"|"$/g, "");
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function clean() {
  console.log("Cleaning test rows...");
  await supabase.from("daftar_aset").delete().eq("nama_aset", "Test Aset");
  await supabase.from("daftar_aset").delete().eq("nama_aset", "Test Aset UUID");
  await supabase.from("daftar_aset").delete().eq("nama_aset", "Test Aset Int");
  await supabase.from("daftar_aset").delete().eq("nama_aset", "Test Aset Text");
  console.log("Cleaned.");
}

clean();
