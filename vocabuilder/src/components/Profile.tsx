// src/components/Profile.tsx
import { useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase_main";
import { useUser } from "../context/UserContext";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export default function Profile() {
  const { firebaseUser, profile, loading, refreshProfile } = useUser();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }

  if (!firebaseUser || !profile) {
    return (
      <p className="text-sm text-muted-foreground">
        Log in to view your profile.
      </p>
    );
  }

  const xpForNextLevel = (profile.level + 0) * 100; // simple: 100 xp/level
  const progress = Math.min(100, (profile.exp / xpForNextLevel) * 100);

  const levelFlower =
    profile.level < 3 ? "🌱" : profile.level < 5 ? "🌿" : "🌸";

  const hasBeginnerCert = profile.completedLevels.includes("Beginner");
  const hasIntermediateCert = profile.completedLevels.includes("Intermediate");
  const hasAdvancedCert = profile.completedLevels.includes("Advanced");

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // extra safety: ensure profile and firebaseUser exist
    if (!firebaseUser) return;

    try {
      setUploading(true);
      const path = `avatars/${firebaseUser.uid}/${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const userRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userRef, { avatarUrl: url });

      await refreshProfile();
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      alert("Could not update avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-[#3D2817]">Your profile</h2>
        <p className="text-sm text-[#7a6c5c]">
          Track your progress, customize your avatar, and see your achievements.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
        {/* Left: avatar + XP + info */}
        <Card className="border-[#E8DFD4] bg-white">
          <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleAvatarClick}
                className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[#1E3A5F] bg-[#F3E8DD] flex items-center justify-center"
                disabled={uploading}
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{levelFlower}</span>
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-black/40 text-[0.65rem] text-white py-0.5">
                  {uploading ? "Uploading…" : "Change photo"}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold text-[#3D2817]">
                  {profile.displayName || firebaseUser.email}
                </p>
                <p className="text-xs text-[#7a6c5c]">
                  Level {profile.level} · {levelFlower} growing with you
                </p>
              </div>

              {/* XP bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-[#7a6c5c]">
                  <span>Experience</span>
                  <span>
                    {profile.exp} / {xpForNextLevel} XP
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#E8DFD4] overflow-hidden">
                  <div
                    className="h-2 bg-[#1E3A5F]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[0.7rem] text-[#7a6c5c]">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F3E8DD] px-2 py-0.5">
                  <span>🌱</span> Beginner
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E0ECFF] px-2 py-0.5">
                  <span>🌿</span> Intermediate
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFE4F3] px-2 py-0.5">
                  <span>🌸</span> Advanced
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: certificates */}
        <Card className="border-[#E8DFD4] bg-[#FFFBF5]">
          <CardContent className="space-y-3 py-5">
            <CardTitle className="text-sm text-[#3D2817]">
              Certificates
            </CardTitle>
            <p className="text-xs text-[#7a6c5c]">
              You earn a certificate when you complete all quizzes for a level.
            </p>
            <div className="space-y-2 text-xs">
              <CertificateRow
                label="Beginner certificate"
                earned={hasBeginnerCert}
              />
              <CertificateRow
                label="Intermediate certificate"
                earned={hasIntermediateCert}
              />
              <CertificateRow
                label="Advanced certificate"
                earned={hasAdvancedCert}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CertificateRow({ label, earned }: { label: string; earned: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-[#F1E4D6]">
      <span className="text-[#3D2817]">{label}</span>
      <span className="text-[0.75rem]">
        {earned ? "✅ Earned" : "⏳ In progress"}
      </span>
    </div>
  );
}
