
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function SecurityPage() {
  const { data: session } = useSession();
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const setup2FA = async () => {
    const res = await fetch("/api/2fa/setup", { method: "POST" });
    const data = await res.json();
    setQrCode(data.qrCode);
    setSecret(data.secret);
    setShowSetup(true);
  };

  const verify2FA = async () => {
    const res = await fetch("/api/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: verifyToken }),
    });

    if (res.ok) {
      setIs2FAEnabled(true);
      setShowSetup(false);
      alert("2FA enabled successfully!");
    } else {
      alert("Invalid code. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          Two-Factor Authentication
        </h2>
        
        {!is2FAEnabled ? (
          <>
            {!showSetup ? (
              <button
                onClick={setup2FA}
                className="px-4 py-2 bg-green-600 text-white rounded-md"
              >
                Enable 2FA
              </button>
            ) : (
              <div className="space-y-4">
                <p>Scan this QR code with your authenticator app:</p>
                {qrCode && (
                  <Image src={qrCode} alt="QR Code" width={200} height={200} />
                )}
                <p className="text-sm text-gray-600">
                  Or enter this code manually: <code>{secret}</code>
                </p>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter verification code:
                  </label>
                  <input
                    type="text"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    placeholder="6-digit code"
                    className="px-3 py-2 border rounded-md"
                  />
                </div>

                <button
                  onClick={verify2FA}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Verify and Enable
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-green-600">
            ✓ Two-Factor Authentication is enabled
          </div>
        )}
      </div>
    </div>
  );
}