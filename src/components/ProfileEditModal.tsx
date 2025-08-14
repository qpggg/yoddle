import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle } from 'lucide-react';
import { useActivity } from '../hooks/useActivity';
import { User } from '../hooks/useUser';

export interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ open, onClose, user, setUser }) => {
  const { logProfileUpdate } = useActivity();
  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    position: string;
    photo: string | File;
  }>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    position: user?.position || '',
    photo: (user?.avatar || '') as string | File,
  });
  const [photoPreview, setPhotoPreview] = useState(user?.avatar || '');

  useEffect(() => {
    if (open) {
      if (user) {
        setForm({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          position: user.position || '',
          photo: user.avatar || '',
        });
        setPhotoPreview(user.avatar || '');
      } else {
        fetch('/api/profile')
          .then((res) => res.json())
          .then((data) => {
            setForm({
              name: data.user.name || '',
              email: data.user.email || '',
              phone: data.user.phone || '',
              position: data.user.position || '',
              photo: data.user.avatar || '',
            });
            setPhotoPreview(data.user.avatar || '');
          });
      }
    }
  }, [open, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((f) => ({ ...f, photo: reader.result as string }));
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      id: user?.id || '',
      name: form.name,
      email: form.email,
      phone: form.phone,
      position: form.position,
      avatar: typeof form.photo === 'string' ? form.photo : null,
    };
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated.user);

      const profile = updated.user;
      let completionPercent = 0;
      if (profile.name && profile.name.trim()) completionPercent += 20;
      if (profile.email && profile.email.trim()) completionPercent += 20;
      if (profile.phone && profile.phone.trim()) completionPercent += 20;
      if (profile.position && profile.position.trim()) completionPercent += 20;
      if (profile.avatar) completionPercent += 20;

      try {
        await fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: Number(profile.id),
            field: 'profile_completion',
            value: completionPercent,
          }),
        });
      } catch {}

      await logProfileUpdate(
        `Профиль обновлен: ${form.name}, ${form.position} (${completionPercent}% заполнения)`
      );
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.25)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            className="profile-modal"
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              minWidth: 340,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              <label style={{ cursor: 'pointer' }}>
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="profile"
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <UserCircle size={80} color="#750000" />
                )}
                <input type="file" accept="image/*" onChange={handlePhoto} hidden />
                <div style={{ textAlign: 'center', color: '#750000', fontSize: 12, marginTop: 4 }}>
                  Изменить фото
                </div>
              </label>
            </div>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Имя" style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
              <input name="email" value={form.email} onChange={handleChange} placeholder="Email" style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Телефон" style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
              <input name="position" value={form.position} onChange={handleChange} placeholder="Должность" style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#eee', color: '#333', fontWeight: 600, cursor: 'pointer' }}>
                  Отмена
                </button>
                <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#750000', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  Сохранить
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileEditModal;


