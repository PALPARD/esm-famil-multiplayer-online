// Vector SVG Avatars Library for Name-Shahr-Shohrat (No Android Emojis)
// Clean, scalable, modern character illustrations

const AVATAR_LIST = [
  { id: 'fox', name: 'روباه زیرک', bg: 'linear-gradient(135deg, #ff7e5f, #feb47b)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#f97316"/><polygon points="8,10 13,20 6,18" fill="#ea580c"/><polygon points="28,10 23,20 30,18" fill="#ea580c"/><polygon points="10,12 13,19 8,18" fill="#ffedd5"/><polygon points="26,12 23,19 28,18" fill="#ffedd5"/><ellipse cx="18" cy="22" rx="11" ry="9" fill="#ea580c"/><path d="M7 23 C11 20 14 26 18 26 C22 26 25 20 29 23 C27 29 23 31 18 31 C13 31 9 29 7 23 Z" fill="#ffffff"/><circle cx="13" cy="20" r="1.8" fill="#1e293b"/><circle cx="23" cy="20" r="1.8" fill="#1e293b"/><polygon points="16,24 20,24 18,27" fill="#0f172a"/></svg>`
  },
  { id: 'bot', name: 'ربات سایبر', bg: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#0284c7"/><rect x="16.5" y="4" width="3" height="5" fill="#94a3b8"/><circle cx="18" cy="4" r="2.5" fill="#38bdf8"/><rect x="8" y="9" width="20" height="18" rx="5" fill="#0f172a"/><rect x="10.5" y="12" width="15" height="11" rx="3" fill="#1e293b"/><rect x="12" y="15" width="4" height="3" rx="1" fill="#38bdf8"/><rect x="20" y="15" width="4" height="3" rx="1" fill="#38bdf8"/><rect x="13" y="21" width="10" height="1.5" rx="0.5" fill="#38bdf8"/><rect x="5" y="15" width="3" height="6" rx="1" fill="#38bdf8"/><rect x="28" y="15" width="3" height="6" rx="1" fill="#38bdf8"/></svg>`
  },
  { id: 'cat', name: 'گربه فضانورد', bg: 'linear-gradient(135deg, #a855f7, #6366f1)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#7c3aed"/><polygon points="9,8 14,17 7,16" fill="#6d28d9"/><polygon points="27,8 22,17 29,16" fill="#6d28d9"/><circle cx="18" cy="21" r="11" fill="#8b5cf6"/><circle cx="18" cy="22" r="9" fill="#ede9fe"/><circle cx="14" cy="20" r="2" fill="#1e1b4b"/><circle cx="22" cy="20" r="2" fill="#1e1b4b"/><circle cx="14.5" cy="19.5" r="0.7" fill="#ffffff"/><circle cx="22.5" cy="19.5" r="0.7" fill="#ffffff"/><polygon points="17,23 19,23 18,25" fill="#f43f5e"/><path d="M15 26 Q18 28 21 26" stroke="#475569" stroke-width="1.2" fill="none"/></svg>`
  },
  { id: 'ninja', name: 'پاندا نینجا', bg: 'linear-gradient(135deg, #10b981, #059669)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#059669"/><circle cx="9" cy="10" r="4" fill="#0f172a"/><circle cx="27" cy="10" r="4" fill="#0f172a"/><circle cx="18" cy="21" r="12" fill="#ffffff"/><rect x="6" y="14" width="24" height="6" rx="2" fill="#dc2626"/><ellipse cx="13" cy="21" rx="2.5" ry="3" fill="#0f172a"/><ellipse cx="23" cy="21" rx="2.5" ry="3" fill="#0f172a"/><circle cx="13.5" cy="20.5" r="1" fill="#ffffff"/><circle cx="22.5" cy="20.5" r="1" fill="#ffffff"/><ellipse cx="18" cy="25" rx="2" ry="1.2" fill="#0f172a"/><path d="M16 27 Q18 29 20 27" stroke="#0f172a" stroke-width="1.2" fill="none"/></svg>`
  },
  { id: 'bear', name: 'خرس قهرمان', bg: 'linear-gradient(135deg, #d97706, #b45309)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#b45309"/><circle cx="9" cy="10" r="3.5" fill="#78350f"/><circle cx="27" cy="10" r="3.5" fill="#78350f"/><circle cx="18" cy="21" r="11" fill="#92400e"/><ellipse cx="18" cy="24" rx="6" ry="4.5" fill="#fde68a"/><circle cx="13.5" cy="19" r="1.8" fill="#1e293b"/><circle cx="22.5" cy="19" r="1.8" fill="#1e293b"/><ellipse cx="18" cy="23" rx="2" ry="1.5" fill="#1e293b"/><polygon points="14,7 18,3 22,7 20,9 16,9" fill="#f59e0b"/></svg>`
  },
  { id: 'lion', name: 'شیر شجاع', bg: 'linear-gradient(135deg, #eab308, #ca8a04)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#ca8a04"/><circle cx="18" cy="19" r="14" fill="#b45309"/><circle cx="18" cy="19" r="10" fill="#facc15"/><circle cx="13.5" cy="17" r="1.8" fill="#1e293b"/><circle cx="22.5" cy="17" r="1.8" fill="#1e293b"/><ellipse cx="18" cy="21" rx="4" ry="3" fill="#fef08a"/><polygon points="16.5,21 19.5,21 18,23" fill="#1e293b"/><path d="M16 23.5 Q18 25.5 20 23.5" stroke="#1e293b" stroke-width="1.2" fill="none"/></svg>`
  },
  { id: 'ghost', name: 'شبح گیمر', bg: 'linear-gradient(135deg, #818cf8, #4f46e5)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#4338ca"/><path d="M10 27 C10 16 12 11 18 11 C24 11 26 16 26 27 C24 25 22 28 20 25 C18 28 16 25 14 28 C12 25 10 27 10 27 Z" fill="#ffffff"/><circle cx="14" cy="18" r="2.2" fill="#1e1b4b"/><circle cx="22" cy="18" r="2.2" fill="#1e1b4b"/><path d="M7 17 C7 11 11 8 18 8 C25 8 29 11 29 17" stroke="#38bdf8" stroke-width="2.5" fill="none"/><rect x="6" y="15" width="3" height="6" rx="1.5" fill="#38bdf8"/><rect x="27" y="15" width="3" height="6" rx="1.5" fill="#38bdf8"/></svg>`
  },
  { id: 'falcon', name: 'شاهین تیزپا', bg: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#0369a1"/><circle cx="18" cy="19" r="11" fill="#0284c7"/><circle cx="18" cy="16" r="9" fill="#0ea5e9"/><circle cx="14" cy="15" r="2.5" fill="#ffffff"/><circle cx="22" cy="15" r="2.5" fill="#ffffff"/><circle cx="14" cy="15" r="1.3" fill="#0f172a"/><circle cx="22" cy="15" r="1.3" fill="#0f172a"/><polygon points="16,18 20,18 18,25" fill="#f59e0b"/><polygon points="17,21 19,21 18,25" fill="#d97706"/></svg>`
  },
  { id: 'alien', name: 'موجود فضایی', bg: 'linear-gradient(135deg, #22c55e, #16a34a)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#15803d"/><circle cx="18" cy="6" r="2" fill="#86efac"/><path d="M18 8 L18 11" stroke="#86efac" stroke-width="2"/><ellipse cx="18" cy="20" rx="11" ry="10" fill="#4ade80"/><circle cx="12" cy="17" r="2.5" fill="#ffffff"/><circle cx="18" cy="14" r="2.5" fill="#ffffff"/><circle cx="24" cy="17" r="2.5" fill="#ffffff"/><circle cx="12" cy="17" r="1.3" fill="#052e16"/><circle cx="18" cy="14" r="1.3" fill="#052e16"/><circle cx="24" cy="17" r="1.3" fill="#052e16"/><path d="M14 24 Q18 28 22 24" stroke="#052e16" stroke-width="1.5" fill="none"/></svg>`
  },
  { id: 'wizard', name: 'جادوگر دانا', bg: 'linear-gradient(135deg, #6366f1, #4338ca)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#3730a3"/><circle cx="18" cy="21" r="10" fill="#fed7aa"/><polygon points="18,3 9,17 27,17" fill="#6366f1"/><ellipse cx="18" cy="17" rx="12" ry="2.5" fill="#4f46e5"/><circle cx="14" cy="20" r="1.5" fill="#1e1b4b"/><circle cx="22" cy="20" r="1.5" fill="#1e1b4b"/><path d="M13 24 C13 31 23 31 23 24 Z" fill="#ffffff"/></svg>`
  },
  { id: 'dragon', name: 'اژدهای آتشین', bg: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#991b1b"/><polygon points="8,8 13,16 6,15" fill="#ef4444"/><polygon points="28,8 23,16 30,15" fill="#ef4444"/><circle cx="18" cy="20" r="11" fill="#dc2626"/><ellipse cx="18" cy="23" rx="7" ry="5" fill="#fca5a5"/><circle cx="13" cy="18" r="2" fill="#fef08a"/><circle cx="23" cy="18" r="2" fill="#fef08a"/><circle cx="13" cy="18" r="1" fill="#450a0a"/><circle cx="23" cy="18" r="1" fill="#450a0a"/><circle cx="16" cy="22" r="0.8" fill="#450a0a"/><circle cx="20" cy="22" r="0.8" fill="#450a0a"/></svg>`
  },
  { id: 'pilot', name: 'خلبان ماجراجو', bg: 'linear-gradient(135deg, #f97316, #ea580c)',
    svg: `<svg viewBox="0 0 36 36" class="w-full h-full"><circle cx="18" cy="18" r="18" fill="#c2410c"/><circle cx="18" cy="21" r="10" fill="#fed7aa"/><path d="M8 17 C8 11 12 9 18 9 C24 9 28 11 28 17" fill="#78350f"/><rect x="9" y="14" width="18" height="6" rx="3" fill="#0f172a"/><circle cx="14" cy="17" r="2.2" fill="#38bdf8"/><circle cx="22" cy="17" r="2.2" fill="#38bdf8"/><path d="M15 25 Q18 27 21 25" stroke="#78350f" stroke-width="1.3" fill="none"/></svg>`
  }
];

function getAvatarById(id) {
  const found = AVATAR_LIST.find(a => a.id === id);
  return found || AVATAR_LIST[0];
}

function renderAvatarHtml(avatarId, sizeClass = 'w-10 h-10') {
  const av = getAvatarById(avatarId);
  return `
    <div class="${sizeClass} rounded-2xl flex-shrink-0 flex items-center justify-center p-1 shadow-sm transition-transform" style="background: ${av.bg}">
      ${av.svg}
    </div>
  `;
}
