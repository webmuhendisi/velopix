import { useEffect, useRef, useCallback } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "İçerik yazın..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);

  // onChange callback'ini her zaman güncel tut
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current) return;

    // Quill editor'ü oluştur
    const quill = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: placeholder,
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ font: [] }],
            [{ size: [] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
            ["link", "image", "video"],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ["clean"],
          ],
          handlers: {
            image: imageHandler,
          },
        },
        clipboard: {
          matchVisual: false,
        },
      },
      formats: [
        "header",
        "font",
        "size",
        "bold",
        "italic",
        "underline",
        "strike",
        "blockquote",
        "list",
        "indent",
        "link",
        "image",
        "video",
        "color",
        "background",
        "align",
      ],
    });

    quillRef.current = quill;

    // İlk değeri ayarla
    if (value) {
      quill.root.innerHTML = value;
    }

    // Değişiklikleri dinle
    quill.on("text-change", () => {
      const content = quill.root.innerHTML;
      onChangeRef.current(content);
    });

    return () => {
      quill.off("text-change");
    };
  }, [placeholder]);

  // Value değiştiğinde editor'ü güncelle (dışarıdan gelen değişiklikler için)
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  // Image upload handler
  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Dosya boyutu 5MB'dan küçük olmalıdır");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Görsel yüklenemedi");
        }

        const data = await response.json();
        const quill = quillRef.current;
        if (quill) {
          const range = quill.getSelection();
          const index = range ? range.index : quill.getLength();
          quill.insertEmbed(index, "image", data.url);
          quill.setSelection(index + 1);
        }
      } catch (error) {
        alert("Görsel yüklenirken bir hata oluştu");
        console.error(error);
      }
    };
  };

  return (
    <div className="rich-text-editor">
      <div ref={editorRef} style={{ minHeight: "300px" }} />
      <style>{`
        .rich-text-editor .ql-container {
          min-height: 300px;
          font-size: 16px;
        }
        .rich-text-editor .ql-editor {
          min-height: 300px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
