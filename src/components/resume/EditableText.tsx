import { useState, useRef, useEffect } from 'react';

interface Props {
  text: string;
  onSave: (value: string) => void;
  style?: React.CSSProperties;
  inline?: boolean;
}

export default function EditableText({ text, onSave, style, inline }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(text);
  }, [text]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  const handleSave = () => {
    onSave(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setValue(text); setEditing(false); }
        }}
        className="w-full border border-blue-300 rounded px-1 py-0.5 outline-none resize-none"
        style={{ ...style, fontFamily: 'inherit', fontSize: style?.fontSize || 'inherit' }}
      />
    );
  }

  return (
    <span
      onDoubleClick={() => setEditing(true)}
      className={inline ? 'cursor-text hover:bg-yellow-50 rounded px-0.5' : 'block cursor-text hover:bg-yellow-50 rounded px-0.5'}
      style={style}
      title="双击编辑"
    >
      {text || (inline ? '' : '双击编辑...')}
    </span>
  );
}
