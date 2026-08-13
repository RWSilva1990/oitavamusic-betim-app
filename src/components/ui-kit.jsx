import { X, AlertCircle, Trash2 } from 'lucide-react';
import { C } from '@/lib/theme';

export function Btn({ children, variant = 'primary', className = '', ...p }) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...p}>
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <div className="field-wrap">
      {label && <label className="field-label">{label}</label>}
      {children}
    </div>
  );
}

export function Inp({ label, ...p }) {
  return (
    <Field label={label}>
      <input className="input-field" {...p} />
    </Field>
  );
}

export function Modal({ title, onClose, wide, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: wide ? 680 : 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>{title}</h2>
          <Btn variant="ghost" onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </Btn>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ msg, onOk, onCancel }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 900 }}>
      <div className="modal-box" style={{ maxWidth: 340, borderRadius: 14, height: 'auto', display: 'block' }}>
        <div className="modal-body" style={{ textAlign: 'center', padding: 28 }}>
          <AlertCircle size={32} color={C.danger} style={{ marginBottom: 12 }} />
          <p style={{ color: C.textPrimary, marginBottom: 20 }}>{msg}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Btn variant="secondary" onClick={onCancel}>Cancelar</Btn>
            <Btn variant="danger" onClick={onOk}>
              <Trash2 size={14} />Excluir
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Avatar({ member, size = 44, style }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, ...style }}>
      {member?.photo ? <img src={member.photo} alt="" /> : member?.name?.[0] || '?'}
    </div>
  );
}

export function PageTitle({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
      <div>
        <h1 style={{ fontSize: 21, fontWeight: 800, color: C.accent }}>{title}</h1>
        {subtitle && <p style={{ color: C.textSecondary, fontSize: 13 }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: 8 }}>{children}</div>}
    </div>
  );
}
