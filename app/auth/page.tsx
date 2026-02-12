"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useGame } from "@/context/GameContext";

export default function AuthPage() {
  const { signIn, signUp, user, profile, updatePseudo, updatePassword, signOut, loading } =
    useAuth();
  const { rank, levelProgress, totalScore } = useGame();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [identifier, setIdentifier] = useState(""); // pseudo ou email
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [pseudoTouched, setPseudoTouched] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingPseudo, setSavingPseudo] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (mode === "login") {
      const { error: err } = await signIn(identifier, password);
      if (err) setError(err);
      else setMessage("Connecté !");
    } else {
      if (!identifier.trim().includes("@")) {
        setError("Saisis un email valide pour t'inscrire.");
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
      else setMessage("Compte créé et connecté !");
    }
  };

  const handlePseudoUpdate = async () => {
    setError("");
    setMessage("");
    const targetPseudo = pseudoTouched ? pseudo.trim() : (profile.pseudo ?? "").trim();
    if (!targetPseudo) {
      setError("Saisis un pseudo avant de valider.");
      return;
    }
    if (!/^[a-zA-Z0-9]{3,15}$/.test(targetPseudo)) {
      setError("Pseudo invalide : 3-15 caractères, seulement lettres/chiffres.");
      return;
    }
    setSavingPseudo(true);
    const { error: err } = await updatePseudo(targetPseudo);
    if (err) setError(err);
    else {
      setMessage(`Pseudo mis à jour : ${targetPseudo}`);
      setPseudo(targetPseudo);
      setPseudoTouched(false);
    }
    setSavingPseudo(false);
  };

  const handlePasswordUpdate = async () => {
    setPasswordError("");
    setPasswordMessage("");
    setError("");
    setMessage("");
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSavingPassword(true);
    try {
      const { error: err } = await updatePassword(newPassword);
      if (err) {
        setPasswordError(err);
        setError(err);
      } else {
        setPasswordMessage("Mot de passe mis à jour.");
        setMessage("Mot de passe mis à jour.");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError("Impossible de mettre à jour le mot de passe. Réessaie.");
      setError("Impossible de mettre à jour le mot de passe. Réessaie.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/")}
          className="px-3 py-2 rounded-full bg-white/10 border border-white/10 text-sm"
        >
          ← Accueil
        </button>
        {user && (
          <button
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="px-3 py-2 rounded-full bg-white/10 border border-white/10 text-sm"
          >
            Déconnexion
          </button>
        )}
      </div>

      <h1 className="text-2xl font-semibold mb-2">Compte joueur</h1>
      <p className="text-slate-300 mb-4 text-sm">
        {user
          ? `Connecté en tant que ${profile.pseudo ?? "(pseudo manquant)"} — ${profile.email ?? ""}`
          : "Modifie tes informations ici."}
      </p>

      {!user && (
        <>
          <div className="flex gap-2 mb-4">
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
        </>
      )}

      {user && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-2">
            <h2 className="text-lg font-semibold">Statistiques</h2>
            <p className="text-sm text-slate-200">
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              <span
                className={`px-3 py-1 rounded-full border ${
                  rank === "Explorateur"
                    ? "bg-slate-800/60 border-slate-500 text-slate-100"
                    : rank === "Voyageur"
                    ? "bg-emerald-900/50 border-emerald-500 text-emerald-100"
                    : rank === "Géographe"
                    ? "bg-cyan-900/50 border-cyan-500 text-cyan-100"
                    : rank === "Cartographe"
                    ? "bg-indigo-900/50 border-indigo-500 text-indigo-100"
                    : "bg-amber-900/50 border-amber-400 text-amber-100"
                }`}
              >
                Rang : {rank}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                Niveaux débloqués : {levelProgress.filter((l) => l.unlocked).length}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                Niveaux complétés : {levelProgress.filter((l) => l.completed).length}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                Score total : {totalScore}/300
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3">
            <p className="text-sm text-slate-200">Modifie tes informations ici.</p>
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nouveau pseudo"
                  value={pseudoTouched ? pseudo : profile.pseudo ?? ""}
                  onChange={(e) => {
                    setPseudo(e.target.value);
                    setPseudoTouched(true);
                  }}
                  className="flex-1 rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handlePseudoUpdate}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm"
                  disabled={savingPseudo}
                >
                  Mettre à jour
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 text-sm"
                />
                <input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handlePasswordUpdate}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={savingPassword || !newPassword || !confirmPassword}
              >
                Mettre à jour le mot de passe
              </button>
              <div className="text-xs">
                {(passwordError || error) && (
                  <p className="text-red-300">{passwordError || error}</p>
                )}
                {!passwordError && !error && (passwordMessage || message) && (
                  <p className="text-emerald-300">{passwordMessage || message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {(message || error) && (
        <div
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            error ? "bg-red-500/20 border border-red-500/40" : "bg-green-500/20 border border-green-500/40"
          }`}
        >
          {error || message}
        </div>
      )}
    </main>
  );
}
