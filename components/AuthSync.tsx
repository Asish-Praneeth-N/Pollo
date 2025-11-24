"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function AuthSync() {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        async function syncUser() {
            if (!isLoaded || !user) return;

            try {
                const userDocRef = doc(db, "users", user.id);
                const userSnapshot = await getDoc(userDocRef);

                if (!userSnapshot.exists()) {
                    await setDoc(userDocRef, {
                        email: user.primaryEmailAddress?.emailAddress,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        imageUrl: user.imageUrl,
                        createdAt: new Date(),
                    });
                    console.log("User synced to Firestore");
                }
            } catch (error) {
                console.error("Error syncing user to Firestore:", error);
            }
        }

        syncUser();
    }, [user, isLoaded]);

    return null;
}
