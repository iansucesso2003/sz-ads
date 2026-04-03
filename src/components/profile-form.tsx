"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Building2, Calendar, Loader2, KeyRound, Camera, X } from "lucide-react";

interface ProfileFormProps {
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date | null;
  organizationName: string | null;
  hasPassword: boolean;
}

function getInitials(name: string | null, email: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ProfileForm({
  name: initialName,
  email,
  image: initialImage,
  createdAt,
  organizationName,
  hasPassword,
}: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName || "");
  const [saving, setSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [image, setImage] = useState<string | null>(initialImage);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImage(initialImage);
  }, [initialImage]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setNameSuccess(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setNameSuccess(true);
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar senha");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      router.refresh();
    } catch (err) {
      setPasswordError((err as Error).message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Digite um email válido");
      return;
    }
    if (trimmed === (email || "").toLowerCase()) {
      setEmailError("O novo email é igual ao atual");
      return;
    }
    setEmailSaving(true);
    try {
      const res = await fetch("/api/profile/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, password: emailPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar email");
      setNewEmail("");
      setEmailPassword("");
      setShowEmailForm(false);
      router.refresh();
    } catch (err) {
      setEmailError((err as Error).message);
    } finally {
      setEmailSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Use JPEG, PNG ou WebP");
      return;
    }
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/profile/image", {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar");
      setImage(data.image);
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = async () => {
    setImageUploading(true);
    try {
      const res = await fetch("/api/profile/image", { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
      setImage(null);
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com avatar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="relative group">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-white/10 text-2xl font-semibold text-white">
            {image ? (
              <img
                src={image}
                alt="Foto do perfil"
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(name || initialName, email)
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Alterar foto"
            >
              {imageUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </button>
            {image && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={imageUploading}
                className="p-2 rounded-lg bg-white/20 hover:bg-red-500/50 text-white transition-colors"
                title="Remover foto"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-xs text-white/50 hover:text-white/80 transition-colors sm:hidden"
          >
            Alterar foto
          </button>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">
            {name || initialName || "Sem nome"}
          </h1>
          <p className="text-sm text-white/50">{email || "—"}</p>
          {organizationName && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/40">
              <Building2 className="h-3.5 w-3.5" />
              {organizationName}
            </p>
          )}
        </div>
      </div>

      {/* Editar nome */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <User className="h-4 w-4" />
            Informações pessoais
          </CardTitle>
          <CardDescription className="text-white/60">
            Atualize seu nome de exibição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/80">
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="max-w-md bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={saving || !name.trim() || name.trim() === (initialName || "")}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              {nameSuccess && (
                <span className="text-sm text-emerald-400">Salvo!</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Email */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Mail className="h-4 w-4" />
            Email
          </CardTitle>
          <CardDescription className="text-white/60">
            {hasPassword
              ? "Altere seu email de login (será necessário confirmar com sua senha)"
              : "Seu email de login"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPassword ? (
            !showEmailForm ? (
              <div className="space-y-3">
                <p className="text-white/90">{email || "—"}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEmailForm(true)}
                  className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  Alterar email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="newEmail" className="text-white/80">
                    Novo email
                  </Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPassword" className="text-white/80">
                    Senha atual (para confirmar)
                  </Label>
                  <Input
                    id="emailPassword"
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-400">{emailError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={emailSaving}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                  >
                    {emailSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {emailSaving ? "Salvando..." : "Alterar email"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEmailForm(false);
                      setEmailError("");
                      setNewEmail("");
                      setEmailPassword("");
                    }}
                    className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )
          ) : (
            <p className="text-white/90">{email || "—"}</p>
          )}
        </CardContent>
      </Card>

      {/* Conta criada em */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Calendar className="h-4 w-4" />
            Conta
          </CardTitle>
          <CardDescription className="text-white/60">
            Informações da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/70">
            Membro desde {formatDate(createdAt)}
          </p>
        </CardContent>
      </Card>

      {/* Alterar senha (apenas se tem senha) */}
      {hasPassword && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <KeyRound className="h-4 w-4" />
              Segurança
            </CardTitle>
            <CardDescription className="text-white/60">
              Altere sua senha de acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordForm(true)}
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Alterar senha
              </Button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current" className="text-white/80">
                    Senha atual
                  </Label>
                  <Input
                    id="current"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new" className="text-white/80">
                    Nova senha
                  </Label>
                  <Input
                    id="new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-white/80">
                    Confirmar nova senha
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-400">{passwordError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={passwordSaving}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                  >
                    {passwordSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {passwordSaving ? "Salvando..." : "Alterar senha"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordError("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
