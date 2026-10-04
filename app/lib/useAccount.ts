"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

export function useAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [adminUid, setAdminUid] = useState<string | null>(null);
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let generation = 0;
    const unsubscribeAuth = onAuthStateChanged(auth, (account) => {
      const current = ++generation;
      unsubscribeProfile?.();
      setUser(account);
      setAdminUid(null);
      if (account?.emailVerified) {
        unsubscribeProfile = onSnapshot(
          doc(db, "users", account.uid),
          (profile) => {
            if (current !== generation) return;
            if (
              !profile.exists() ||
              profile.data()?.disabled ||
              ["deleting", "deleted"].includes(profile.data()?.accountState)
            ) {
              void signOut(auth);
              return;
            }
            setAdminUid(profile.data()?.role === "admin" ? account.uid : null);
          },
          () => {
            if (current === generation) setAdminUid(null);
          },
        );
      }
    });
    return () => {
      ++generation;
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);
  return {
    user,
    isAdmin: !!user && user.emailVerified && adminUid === user.uid,
  };
}
