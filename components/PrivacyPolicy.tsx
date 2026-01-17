
import React from 'react';
import { NeumorphicButton } from './NeumorphicButton';

interface Props {
  onClose: () => void;
}

export const PrivacyPolicy: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-md animate-in fade-in duration-300">
      <div className="neu-card w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8 relative flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-primary">Privacy Policy</h2>
            <p className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1">Version 3.6 - Global Standards</p>
          </div>
          <NeumorphicButton onClick={onClose} className="w-10 h-10 p-0 flex items-center justify-center rounded-full text-red-500">
            ✕
          </NeumorphicButton>
        </div>

        <div className="space-y-6 text-sm text-secondary leading-relaxed overflow-y-auto pr-4 custom-scrollbar">
          <section>
            <h3 className="text-primary font-bold mb-2">1. Pengolahan Data Lokal</h3>
            <p>Dompet PRO memprioritaskan privasi Anda. Semua data transaksi, saldo, dan target tabungan disimpan secara lokal di browser Anda (LocalStorage). Kami tidak menyimpan data keuangan Anda di server pusat eksternal.</p>
          </section>

          <section>
            <h3 className="text-primary font-bold mb-2">2. Intelegensi Buatan (Gemini AI)</h3>
            <p>Fitur "AI Advisor" dan "Parsing Command" menggunakan Google Gemini API. Ketika Anda menggunakan fitur ini, hanya data terkait (teks command atau ringkasan angka transaksi) yang dikirimkan ke model AI untuk diproses. Tidak ada informasi identitas pribadi (seperti nama asli atau nomor rekening) yang dibagikan secara otomatis kecuali jika Anda menuliskannya dalam catatan.</p>
          </section>

          <section>
            <h3 className="text-primary font-bold mb-2">3. Keamanan PIN</h3>
            <p>Sistem keamanan PIN dienkripsi menggunakan standar enkripsi browser. Namun, PIN ini bersifat akses kontrol lokal dan bukan pengganti keamanan perbankan resmi.</p>
          </section>

          <section>
            <h3 className="text-primary font-bold mb-2">4. Analitik & Monitoring</h3>
            <p>Monitoring sistem di "Intelligence Hub" hanya memantau performa teknis (seperti latensi API dan status uptime) untuk memastikan aplikasi berjalan lancar. Tidak ada pelacakan aktivitas pengguna (tracking) untuk tujuan iklan.</p>
          </section>

          <div className="neu-inset p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
            <p className="text-xs italic text-blue-500 font-medium">
              "Privasi adalah hak asasi manusia. Di Dompet PRO, kami membangun transparansi melalui teknologi."
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <NeumorphicButton onClick={onClose} className="bg-blue-500 text-white min-w-[150px]">
            Saya Mengerti
          </NeumorphicButton>
        </div>
      </div>
    </div>
  );
};
