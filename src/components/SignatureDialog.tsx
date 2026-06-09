"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Fingerprint, Lock, ShieldCheck, AlertCircle, KeyRound } from "lucide-react";
import { verifySignaturePin, verifySignatureBiometrics } from "@/app/actions/user";

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerifySuccess: () => void;
  lang?: "th" | "en";
}

export function SignatureDialog({
  open,
  onOpenChange,
  onVerifySuccess,
  lang = "th",
}: SignatureDialogProps) {
  const [method, setMethod] = useState<"pin" | "biometrics">("pin");
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bioScanning, setBioScanning] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Reset states on dialog open
  useEffect(() => {
    if (open) {
      setPin(Array(6).fill(""));
      setError(null);
      setLoading(false);
      setBioScanning(false);
      setSuccess(false);
      // Autofocus first PIN input if PIN method is active
      setTimeout(() => {
        if (method === "pin" && inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [open, method]);

  const handlePinChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Allow numbers only

    const newPin = [...pin];
    newPin[index] = value.substring(value.length - 1); // Only keep the last digit
    setPin(newPin);
    setError(null);

    // Jump to next input if filled
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      // Jump to previous on backspace if current is empty
      const newPin = [...pin];
      newPin[index - 1] = "";
      setPin(newPin);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pinStr = pin.join("");
    if (pinStr.length !== 6) {
      setError(lang === "th" ? "กรุณากรอกรหัส PIN ให้ครบ 6 หลัก" : "Please enter all 6 digits of your PIN");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await verifySignaturePin(pinStr);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onVerifySuccess();
          onOpenChange(false);
        }, 800);
      } else {
        setError(res.error || (lang === "th" ? "รหัส PIN ไม่ถูกต้อง" : "Invalid PIN code"));
      }
    } catch (err: any) {
      setError(err.message || (lang === "th" ? "เกิดข้อผิดพลาดในการเชื่อมต่อ" : "Connection error"));
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricVerify = async () => {
    setBioScanning(true);
    setError(null);
    try {
      // Simulate slight delay for hardware reading animation
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const res = await verifySignatureBiometrics({});
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onVerifySuccess();
          onOpenChange(false);
        }, 800);
      } else {
        setError(res.error || (lang === "th" ? "ไม่พบประวัติลายนิ้วมือ กรุณาลงทะเบียนที่หน้าข้อมูลส่วนตัว" : "Biometrics not registered. Please register in your profile settings."));
      }
    } catch (err: any) {
      setError(err.message || (lang === "th" ? "การยืนยันตัวตนล้มเหลว" : "Biometric validation failed"));
    } finally {
      setBioScanning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl border border-white/60 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-6 shadow-2xl overflow-hidden">
        <DialogHeader className="space-y-2 pb-2">
          <DialogTitle className="flex items-center gap-2.5 text-base md:text-lg font-extrabold text-slate-900 dark:text-white">
            <Lock className="w-5 h-5 text-primary" />
            <span>{lang === "th" ? "ระบบรักษาความปลอดภัย ลายมือชื่ออิเล็กทรอนิกส์" : "Secure E-Signature Authorization"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {lang === "th" ? "กรุณายืนยันตัวตนเพื่ออนุมัติและลงลายเซ็นดิจิทัลในเอกสารนี้" : "Please authenticate to sign and authorize this official document."}
          </DialogDescription>
        </DialogHeader>

        {/* Success Splash */}
        {success ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <ShieldCheck className="w-8 h-8 animate-bounce" />
            </div>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              {lang === "th" ? "อนุมัติและลงลายเซ็นสำเร็จ" : "Authorization Successful"}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Method Selectors */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100/80 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200/40 dark:border-slate-850/40">
              <button
                type="button"
                onClick={() => setMethod("pin")}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  method === "pin"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm border-b border-slate-200/50 dark:border-slate-700/50"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>PIN Code</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethod("biometrics");
                  // Trigger bio check automatically when tab switched
                  setTimeout(handleBiometricVerify, 200);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  method === "biometrics"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm border-b border-slate-200/50 dark:border-slate-700/50"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>{lang === "th" ? "ลายนิ้วมือ / ใบหน้า" : "Biometrics"}</span>
              </button>
            </div>

            {/* Error display */}
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">{error}</p>
              </div>
            )}

            {/* Method Forms */}
            {method === "pin" ? (
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="flex justify-center gap-2">
                  {pin.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        if (el) inputRefs.current[idx] = el;
                      }}
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(e.target.value, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      disabled={loading}
                      className="w-11 h-12 text-center text-lg font-bold border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/15 outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading || pin.join("").length !== 6}
                    className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all shadow-md shadow-primary/10"
                  >
                    {loading ? (
                      <div className="flex items-center gap-1.5 justify-center">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>{lang === "th" ? "กำลังตรวจสอบ..." : "Verifying..."}</span>
                      </div>
                    ) : (
                      <span>{lang === "th" ? "ยืนยันรหัสและลงชื่อ" : "Authorize & Sign"}</span>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <button
                  type="button"
                  onClick={handleBiometricVerify}
                  disabled={bioScanning}
                  className={`w-20 h-20 rounded-full flex items-center justify-center border cursor-pointer transition-all ${
                    bioScanning
                      ? "border-primary bg-primary/5 text-primary animate-pulse shadow-lg shadow-primary/5 scale-105"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  <Fingerprint className={`w-10 h-10 ${bioScanning ? "animate-pulse" : ""}`} />
                </button>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {bioScanning
                      ? (lang === "th" ? "โปรดแตะที่เซนเซอร์สแกนนิ้วมือ..." : "Tap your fingerprint sensor...")
                      : (lang === "th" ? "คลิกไอคอนเพื่อเริ่มการสแกน" : "Click icon to scan biometrics")}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {lang === "th" ? "สแกนนิ้วมือหรือใบหน้าผ่านอุปกรณ์ของคุณ" : "Authenticate via device FaceID/TouchID"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
