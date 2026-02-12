"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, signIn, signUp, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [identifier, setIdentifier] = useState(""); // pseduo ou email
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.push("/modes");
  }, [router, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (mode === "login") {
      const { error: err } = await signIn(identifier, password);
      if (err) setError(err);
      else {
        setMessage("Connecté !");
        router.push("/modes");
      }
    } else {
      if (!identifier.trim().includes("@")) {
        setError("Saisis un email valide pour t'inscrire");
        return;
      }
      if (!pseudo.trim()) {
        setError("Choisis un pseudo pour t'inscrire");
        return;
      }
      if (!/^[a-zA-Z0-9]{3,15}$/.test(pseudo.trim())) {
        setError("Pseudo invalide : 3-15 caractères, seulement lettres/chiffres.");
        return;
      }
      const { error: err } = await signUp(identifier, password, pseudo.trim());
      if (err) setError(err);
      else {
        setMessage("Compte créé et connecté !");
        router.push("/modes");
      }
    }
  };

  return (
    <main className="min-h-screen px-5 py-10 flex flex-col gap-8 md:px-8 max-w-3xl mx-auto">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-4xl font-bold">GeoLoulou</h1>
        <p className="text-slate-200 text-lg">
          Connecte-toi ou crée un compte pour sauvegarder ta progression et jouer
          aux modes Libre et Progression.
        </p>
      </header>

      <section className="card rounded-3xl p-5 space-y-4">
        <div className="flex gap-2">
          <button
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${
              mode === "login" ? "bg-cyan-500 text-white" : "bg-white/5 text-slate-200"
            }`}
            onClick={() => setMode("login")}
          >
            Connexion
          </button>
        <button
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${
              mode === "signup" ? "bg-cyan-500 text-white" : "bg-white/5 text-slate-200"
            }`}
            onClick={() => setMode("signup")}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="space-y-1">
            <label className="text-sm text-slate-200">
              {mode === "login" ? "pseudo ou Email" : "Email"}
            </label>
            <input
              type={mode === "login" ? "text" : "email"}
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 text-sm"
            />
          </div>
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-sm text-slate-200">Pseudo</label>
              <input
                type="text"
                required
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                className="w-full rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 text-sm"
              />
              <p className="text-xs text-slate-400">
                3 à 15 caractères, lettres et chiffres uniquement.
              </p>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm text-slate-200">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-500 text-white rounded-lg py-2 font-semibold"
            disabled={loading}
          >
            {mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        {(message || error) && (
          <div
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              error ? "bg-red-500/20 border border-red-500/40" : "bg-green-500/20 border border-green-500/40"
            }`}
          >
            {error || message}
          </div>
        )}
      </section>
    </main>
  );
}
