import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────
const STORIES = [
  {
    id: 1,
    title: "Vùng Đất Hứa",
    cover: "https://picsum.photos/seed/story1/300/420",
    team: "Yên Khôi",
    genre: ["Tình cảm", "Drama"],
    views: 128400,
    rating: 4.8,
    desc: "Năm thứ bảy sau khi ly hôn, tôi về nước. Một khuôn mặt có đến tám phần giống tôi xuất hiện trong ống kính máy ảnh...",
    chapters: [
      { id: 1, title: "Chương 1: Trở về", locked: false, coins: 0 },
      { id: 2, title: "Chương 2: Cuộc gặp gỡ", locked: false, coins: 0 },
      { id: 3, title: "Chương 3: Bí mật", locked: true, coins: 5 },
      { id: 4, title: "Chương 4: Sự thật", locked: true, coins: 5 },
      { id: 5, title: "Chương 5: Hành trình", locked: true, coins: 8 },
    ],
  },
  {
    id: 2,
    title: "Kiếm Thần Vô Song",
    cover: "https://picsum.photos/seed/story2/300/420",
    team: "Dragon Team",
    genre: ["Hành động", "Tiên hiệp"],
    views: 95200,
    rating: 4.6,
    desc: "Thiên tài kiếm thuật bị phản bội, tái sinh với sức mạnh vô song. Cuộc hành trình báo thù bắt đầu...",
    chapters: [
      { id: 1, title: "Chương 1: Tái sinh", locked: false, coins: 0 },
      { id: 2, title: "Chương 2: Thức tỉnh", locked: false, coins: 0 },
      { id: 3, title: "Chương 3: Luyện tập", locked: true, coins: 5 },
    ],
  },
  {
    id: 3,
    title: "Cô Nàng Nổi Loạn",
    cover: "https://picsum.photos/seed/story3/300/420",
    team: "Pink Studio",
    genre: ["Học đường", "Hài hước"],
    views: 76800,
    rating: 4.5,
    desc: "Học sinh cá biệt số một trường chạm mặt thầy giáo mới cực kỳ nghiêm túc. Liệu ai sẽ thay đổi ai?",
    chapters: [
      { id: 1, title: "Chương 1: Ngày đầu", locked: false, coins: 0 },
      { id: 2, title: "Chương 2: Đối đầu", locked: true, coins: 5 },
    ],
  },
  {
    id: 4,
    title: "Bóng Tối Thành Phố",
    cover: "https://picsum.photos/seed/story4/300/420",
    team: "Shadow Ink",
    genre: ["Trinh thám", "Bí ẩn"],
    views: 61300,
    rating: 4.7,
    desc: "Thám tử tư trẻ tuổi điều tra vụ mất tích hàng loạt. Phía sau là âm mưu bí ẩn của giới thượng lưu...",
    chapters: [
      { id: 1, title: "Chương 1: Vụ án", locked: false, coins: 0 },
      { id: 2, title: "Chương 2: Manh mối", locked: true, coins: 5 },
    ],
  },
];

];

const MOCK_COMMENTS = [
  { id: 1, user: "Minh Anh", avatar: "https://picsum.photos/seed/u1/40/40", text: "Truyện hay quá! Chờ chương tiếp theo mãi rồi 😭", time: "2 giờ trước", likes: 24 },
  { id: 2, user: "Thanh Hương", avatar: "https://picsum.photos/seed/u2/40/40", text: "Team Yên Khôi dịch mượt lắm, cảm ơn các bạn nhiều ❤️", time: "5 giờ trước", likes: 18 },
  { id: 3, user: "Quốc Bảo", avatar: "https://picsum.photos/seed/u3/40/40", text: "Chương 3 mà khoá vậy, đành nạp xu thôi 😅", time: "1 ngày trước", likes: 11 },
];

// ─── ICONS ────────────────────────────────────────────────────
const Icon = {
  lock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>,
  coin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>,
  star: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>,
  eye: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>,
  heart: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  share: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>,
  fb: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  tiktok: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>,
  close: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
  google: () => <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
  ad: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 12H5V8h14v8z"/></svg>,
};

// ─── ADSENSE BANNER ────────────────────────────────────────────
function AdBanner({ slot = "top" }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #fff8e1, #fff3cd)",
      border: "1px dashed #f59e0b",
      borderRadius: 8,
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 12,
      color: "#92400e",
      margin: slot === "inline" ? "16px 0" : "0 0 16px 0",
    }}>
      <Icon.ad />
      <span style={{ opacity: 0.6, fontSize: 10, background: "#f59e0b22", padding: "2px 6px", borderRadius: 4 }}>Quảng cáo</span>
      <span style={{ flex: 1, textAlign: "center", fontWeight: 600 }}>
        {slot === "top" ? "📢 Google AdSense — Banner 728×90 (tích hợp thực tế)" : "📦 Quảng cáo giữa chapter — AdSense Responsive"}
      </span>
    </div>
  );
}


// ─── SHARE MODAL ───────────────────────────────────────────────
function ShareModal({ story, chapter, onClose }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://daisylexi.com/truyen/${story.id}${chapter ? `/chuong-${chapter.id}` : ""}`;
  const shareText = chapter
    ? `📖 Đọc "${story.title}" - ${chapter.title} tại Readunlocked! Truyện hay lắm nha 🔥`
    : `📖 "${story.title}" - Truyện hay đang hot tại Readunlocked! Đọc ngay 👇`;

  const copy = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><Icon.close /></button>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Chia sẻ truyện</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b7280" }}>{story.title}{chapter ? ` — ${chapter.title}` : ""}</p>

        {/* Preview card */}
        <div style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <img src={story.cover} alt="" style={{ width: 60, height: 84, borderRadius: 8, objectFit: "cover" }} />
          <div>
            <div style={{ color: "#a5b4fc", fontSize: 11, marginBottom: 4 }}>daisylexi.com</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{story.title}</div>
            {chapter && <div style={{ color: "#c7d2fe", fontSize: 12, marginTop: 4 }}>{chapter.title}</div>}
            <div style={{ color: "#818cf8", fontSize: 11, marginTop: 6 }}>⭐ {story.rating} · 👁 {(story.views / 1000).toFixed(0)}K lượt đọc</div>
          </div>
        </div>

        {/* Caption */}
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 13, color: "#374151", lineHeight: 1.5, border: "1px solid #e2e8f0" }}>
          {shareText}
        </div>

        {/* Share buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, "_blank")}
            style={{ flex: 1, background: "#1877f2", color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 600, fontSize: 13 }}>
            <Icon.fb /> Facebook
          </button>
          <button onClick={() => window.open(`https://www.tiktok.com/`, "_blank")}
            style={{ flex: 1, background: "#000", color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 600, fontSize: 13 }}>
            <Icon.tiktok /> TikTok
          </button>
        </div>

        {/* Copy link */}
        <div style={{ display: "flex", gap: 8 }}>
          <input readOnly value={shareUrl} style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#374151", background: "#f8fafc" }} />
          <button onClick={copy} style={{ background: copied ? "#16a34a" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
            {copied ? "✓ Đã copy" : "Copy link"}
          </button>
        </div>

        <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 12, marginBottom: 0, textAlign: "center" }}>
          💡 Chia sẻ chương miễn phí → kéo người đọc → mua xu đọc tiếp
        </p>
      </div>
    </div>
  );
}

// ─── AUTH MODAL ────────────────────────────────────────────────
function AuthModal({ onClose, onLogin }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handleLogin = (method) => {
    onLogin({ name: method === "fb" ? "Nguyễn Văn A (Facebook)" : method === "gg" ? "user@gmail.com" : email, method });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 380, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><Icon.close /></button>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🐱</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Readunlocked</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Đăng nhập để đọc truyện & tích xu</p>
        </div>

        {/* Social login */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <button onClick={() => handleLogin("fb")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", background: "#1877f2", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            <Icon.fb /> Đăng nhập bằng Facebook
          </button>
          <button onClick={() => handleLogin("gg")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", background: "#fff", color: "#374151", border: "1px solid #e2e8f0", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            <Icon.google /> Đăng nhập bằng Google
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          <span style={{ fontSize: 12, color: "#9ca3af" }}>hoặc</span>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        </div>

        {/* Tab */}
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3, marginBottom: 16 }}>
          {["login", "register"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, background: tab === t ? "#fff" : "transparent", color: tab === t ? "#6366f1" : "#6b7280", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
              {t === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }} />
          <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Mật khẩu" type="password" style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }} />
          <button onClick={() => handleLogin("email")} style={{ padding: "12px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            {tab === "login" ? "Đăng nhập" : "Đăng ký ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COIN MODAL ─────────────────────────────────────────────────
function CoinModal({ onClose, onPurchase, currentCoins }) {
  const packages = [
    { id: 1, coins: 20, price: "10.000₫", bonus: "" },
    { id: 2, coins: 50, price: "20.000₫", bonus: "+5 bonus" },
    { id: 3, coins: 120, price: "45.000₫", bonus: "+20 bonus 🔥" },
    { id: 4, coins: 300, price: "99.000₫", bonus: "+80 bonus ⚡" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><Icon.close /></button>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 32 }}>🪙</div>
          <h3 style={{ margin: "4px 0", fontSize: 16, fontWeight: 700 }}>Nạp xu</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Xu hiện tại: <strong style={{ color: "#f59e0b" }}>{currentCoins} xu</strong></p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {packages.map(pkg => (
            <button key={pkg.id} onClick={() => { onPurchase(pkg.coins); onClose(); }}
              style={{ background: pkg.bonus.includes("🔥") ? "linear-gradient(135deg, #fef3c7, #fde68a)" : pkg.bonus.includes("⚡") ? "linear-gradient(135deg, #ede9fe, #ddd6fe)" : "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>{pkg.coins}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>xu</div>
              {pkg.bonus && <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>{pkg.bonus}</div>}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginTop: 6 }}>{pkg.price}</div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["VNPay", "Momo", "ZaloPay"].map(m => (
            <button key={m} style={{ flex: 1, padding: "8px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 600, color: "#374151" }}>{m}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── COMMENT SECTION ────────────────────────────────────────────
function CommentSection({ user, onLoginRequest }) {
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [text, setText] = useState("");
  const [liked, setLiked] = useState({});

  const submit = () => {
    if (!user) { onLoginRequest(); return; }
    if (!text.trim()) return;
    setComments(prev => [{ id: Date.now(), user: user.name, avatar: `https://picsum.photos/seed/${Date.now()}/40/40`, text, time: "Vừa xong", likes: 0 }, ...prev]);
    setText("");
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
        💬 Bình luận <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>({comments.length})</span>
      </h4>

      {/* Input */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-start" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: user ? "#6366f1" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
          {user ? user.name[0] : "👤"}
        </div>
        <div style={{ flex: 1 }}>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={user ? "Viết bình luận..." : "Đăng nhập để bình luận"} rows={2}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            onClick={() => !user && onLoginRequest()} readOnly={!user} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={submit} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Gửi</button>
          </div>
        </div>
      </div>

      {/* List */}
      {comments.map(c => (
        <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <img src={c.avatar} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{c.user}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{c.time}</span>
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{c.text}</p>
            <button onClick={() => setLiked(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: liked[c.id] ? "#ef4444" : "#9ca3af", fontSize: 12, padding: 0 }}>
              <Icon.heart /> {c.likes + (liked[c.id] ? 1 : 0)}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CHAPTER READER ─────────────────────────────────────────────
function ChapterReader({ story, chapter, user, coins, onUnlock, onLoginRequest, onBack, onShare }) {
  const isLocked = chapter.locked && !chapter.unlocked;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#6b7280" }}>←</button>
        <div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{story.title}</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{chapter.title}</div>
        </div>
        <button onClick={onShare} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          <Icon.share /> Chia sẻ
        </button>
      </div>

      <AdBanner slot="top" />

      {isLocked ? (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "linear-gradient(135deg, #faf5ff, #ede9fe)", borderRadius: 16, border: "1px solid #ddd6fe" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Chapter bị khoá</h3>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280" }}>Cần <strong style={{ color: "#7c3aed" }}>{chapter.coins} xu</strong> để mở khoá chapter này</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {!user ? (
              <button onClick={onLoginRequest} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                Đăng nhập để mở khoá
              </button>
            ) : coins >= chapter.coins ? (
              <button onClick={() => onUnlock(chapter)} style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                🪙 Dùng {chapter.coins} xu để mở
              </button>
            ) : (
              <button onClick={onLoginRequest} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                Nạp thêm xu ({coins}/{chapter.coins} xu)
              </button>
            )}
          </div>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 16 }}>💡 Chia sẻ truyện lên Facebook/TikTok để mời bạn bè đọc cùng!</p>
        </div>
      ) : (
        <div>
          {[1, 2, 3].map(i => (
            <div key={i}>
              <img src={`https://picsum.photos/seed/ch${chapter.id}p${i}/600/800`} alt={`Trang ${i}`} style={{ width: "100%", borderRadius: 8, marginBottom: 8, display: "block" }} />
              {i === 2 && <AdBanner slot="inline" />}
            </div>
          ))}
        </div>
      )}

      <CommentSection user={user} onLoginRequest={onLoginRequest} />
    </div>
  );
}

// ─── STORY DETAIL ───────────────────────────────────────────────
function StoryDetail({ story, user, coins, onSpendCoins, onLoginRequest, onBack, onCoinModal }) {
  const [activeChapter, setActiveChapter] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [chapters, setChapters] = useState(story.chapters);

  const unlock = (chapter) => {
    if (coins < chapter.coins) { onCoinModal(); return; }
    onSpendCoins(chapter.coins);
    setChapters(prev => prev.map(c => c.id === chapter.id ? { ...c, unlocked: true } : c));
    setActiveChapter({ ...chapter, unlocked: true });
  };

  if (activeChapter) {
    const ch = chapters.find(c => c.id === activeChapter.id) || activeChapter;
    return (
      <>
        <ChapterReader story={story} chapter={ch} user={user} coins={coins} onUnlock={unlock}
          onLoginRequest={onLoginRequest} onBack={() => setActiveChapter(null)} onShare={() => setShareTarget({ story, chapter: ch })} />
        {shareTarget && <ShareModal story={shareTarget.story} chapter={shareTarget.chapter} onClose={() => setShareTarget(null)} />}
      </>
    );
  }

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 14, marginBottom: 16 }}>← Quay lại</button>

      <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        <img src={story.cover} alt={story.title} style={{ width: 140, height: 196, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>{story.title}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {story.genre.map(g => <span key={g} style={{ background: "#ede9fe", color: "#6d28d9", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{g}</span>)}
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon.star /> {story.rating}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon.eye /> {(story.views / 1000).toFixed(0)}K</span>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{story.desc}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setActiveChapter(chapters[0])} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Đọc ngay</button>
            <button onClick={() => setShareTarget({ story, chapter: null })} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f1f5f9", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              <Icon.share /> Chia sẻ
            </button>
          </div>
        </div>
      </div>

      <AdBanner />

      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Danh sách chương</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {chapters.map(ch => (
          <button key={ch.id} onClick={() => setActiveChapter(ch)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
            onMouseOver={e => e.currentTarget.style.borderColor = "#6366f1"}
            onMouseOut={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{ch.title}</span>
            {ch.locked && !ch.unlocked ? (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>
                <Icon.lock /> {ch.coins} xu
              </span>
            ) : (
              <span style={{ color: "#16a34a", fontSize: 12 }}>✓ Miễn phí</span>
            )}
          </button>
        ))}
      </div>

      {shareTarget && <ShareModal story={shareTarget.story} chapter={shareTarget.chapter} onClose={() => setShareTarget(null)} />}
    </div>
  );
}

// ─── HOME PAGE ──────────────────────────────────────────────────
function HomePage({ onSelectStory, onShare }) {
  const featured = STORIES[0];
  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)", borderRadius: 16, padding: 24, marginBottom: 24, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <img src={featured.cover} alt={featured.title} style={{ width: 120, height: 168, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <span style={{ background: "#f59e0b", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>HOT ⚡</span>
          <h2 style={{ color: "#fff", margin: "8px 0 8px", fontSize: 22, fontWeight: 800 }}>{featured.title}</h2>
          <p style={{ color: "#c7d2fe", fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>{featured.desc.slice(0, 120)}...</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onSelectStory(featured)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Đọc ngay</button>
            <button onClick={() => onShare(featured)} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 13 }}>
              <Icon.share /> Chia sẻ
            </button>
          </div>
        </div>
      </div>

      <AdBanner />

      {/* Story grid */}
      <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>🔥 Mới cập nhật</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14 }}>
        {STORIES.map(s => (
          <div key={s.id} onClick={() => onSelectStory(s)} style={{ cursor: "pointer", borderRadius: 12, overflow: "hidden", background: "#fff", border: "1px solid #e2e8f0", transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ position: "relative" }}>
              <img src={s.cover} alt={s.title} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 8, display: "flex", alignItems: "center", gap: 3 }}>
                <Icon.eye /> {(s.views / 1000).toFixed(0)}K
              </div>
            </div>
            <div style={{ padding: "10px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, lineHeight: 1.3 }}>{s.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
                <Icon.star /> {s.rating}
                <span style={{ marginLeft: 4, background: "#ede9fe", color: "#6d28d9", padding: "1px 6px", borderRadius: 8 }}>{s.genre[0]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ─── APP ROOT ───────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [showCoin, setShowCoin] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [shareStory, setShareStory] = useState(null);
  const [search, setSearch] = useState("");

  const filteredStories = STORIES.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", fontFamily: "'Nunito', 'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100, padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 22 }}>🐱</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#1e1b4b" }}>Readunlocked</span>
          </div>
          <input value={search} onChange={e => { setSearch(e.target.value); setSelectedStory(null); }}
            placeholder="Tìm truyện theo tiêu đề..." style={{ flex: 1, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 20, fontSize: 13, outline: "none", background: "#f8fafc" }} />
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button onClick={() => setShowCoin(true)} style={{ display: "flex", alignItems: "center", gap: 4, background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#92400e" }}>
                <Icon.coin /> {coins}
              </button>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                {user.name[0]}
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ flexShrink: 0, background: "#6366f1", color: "#fff", border: "none", borderRadius: 20, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        {selectedStory ? (
          <StoryDetail story={selectedStory} user={user} coins={coins}
            onSpendCoins={n => setCoins(c => c - n)} onLoginRequest={() => setShowAuth(true)}
            onBack={() => setSelectedStory(null)} onCoinModal={() => setShowCoin(true)} />
        ) : (
          <HomePage onSelectStory={setSelectedStory} onShare={setShareStory}
            stories={search ? filteredStories : STORIES} />
        )}
      </div>

      {/* Modals */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={u => { setUser(u); setCoins(10); }} />}
      {showCoin && <CoinModal onClose={() => setShowCoin(false)} currentCoins={coins} onPurchase={n => setCoins(c => c + n)} />}
      {shareStory && <ShareModal story={shareStory} chapter={null} onClose={() => setShareStory(null)} />}

      {/* Chat bubble */}
      <div style={{ position: "fixed", bottom: 20, right: 20, width: 48, height: 48, background: "#6366f1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.4)", fontSize: 22 }}
        title="Chat hỗ trợ">
        💬
      </div>
    </div>
  );
}
