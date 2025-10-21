import "./index.scss";
import "ckeditor5/ckeditor5.css";

import { ClassicEditor } from "@ckeditor/ckeditor5-editor-classic";
import { Essentials } from "@ckeditor/ckeditor5-essentials";
import { Paragraph } from "@ckeditor/ckeditor5-paragraph";
import {
  Image,
  ImageToolbar,
  ImageUpload,
  ImageCaption,
  ImageStyle,
  ImageResize,
} from "@ckeditor/ckeditor5-image";
import { AutoImage } from "@ckeditor/ckeditor5-image";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useImperativeHandle,
  useRef,
} from "react";

export type CKEditorRef = {
  focus: (moveToEnd?: boolean) => void;
};

interface CKEditorProps {
  value: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onEnter?: () => void;
}

export interface EmojiData {
  src: string;
  alt: string;
}

const keyCodes = {
  delete: 46,
  backspace: 8,
};

const Index: ForwardRefRenderFunction<CKEditorRef, CKEditorProps> = (
  { value, placeholder, onChange, onEnter },
  ref,
) => {
  const ckEditor = useRef<ClassicEditor | null>(null);

  const focus = (moveToEnd = false) => {
    const editor = ckEditor.current;

    if (editor) {
      const model = editor.model;
      const view = editor.editing.view;
      const root = model.document.getRoot();
      if (moveToEnd && root) {
        const range = model.createRange(model.createPositionAt(root, "end"));

        model.change((writer) => {
          writer.setSelection(range);
        });
      }
      view.focus();
    }
  };

  const listenKeydown = (editor: ClassicEditor) => {
    editor.editing.view.document.on(
      "keydown",
      (evt, data) => {
        if (data.keyCode === 13 && !data.shiftKey) {
          data.preventDefault();
          evt.stop();
          onEnter?.();
          return;
        }
        if (data.keyCode === keyCodes.backspace || data.keyCode === keyCodes.delete) {
          const selection = editor.model.document.selection;
          const hasSelectContent = !editor.model.getSelectedContent(selection).isEmpty;
          const hasEditorContent = Boolean(editor.getData());

          if (!hasEditorContent) {
            return;
          }

          if (hasSelectContent) return;
        }
      },
      { priority: "high" },
    );
  };

  const handlePaste = (editor: ClassicEditor) => {
    editor.editing.view.document.on("paste", (evt, data) => {
      const clipboardData =
        data.dataTransfer?.getData("text/html") ||
        data.dataTransfer?.getData("text/plain");

      if (clipboardData) {
        // 检查是否包含图片
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = clipboardData;
        const images = tempDiv.querySelectorAll("img");

        if (images.length > 0) {
          // 处理粘贴的图片
          images.forEach((img) => {
            const src = img.getAttribute("src");
            if (src && src.startsWith("data:image")) {
              // 直接插入base64图片
              const imgTag = `<img src="${src}" alt="pasted image" style="max-width: 200px; max-height: 200px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);" />`;
              editor.model.change((writer) => {
                const viewFragment = editor.data.processor.toView(imgTag);
                const modelFragment = editor.data.processor.toModel(viewFragment);
                editor.model.insertContent(modelFragment);
              });
            }
          });
        }
      }
    });
  };

  const handleImageClick = (editor: ClassicEditor) => {
    // 使用更可靠的方式监听图片点击
    editor.editing.view.document.on(
      "click",
      (evt, data) => {
        const target = data.domTarget as HTMLElement;
        if (target && target.tagName === "IMG") {
          evt.stop();
          const src = target.getAttribute("src");
          if (src) {
            // 创建图片预览模态框
            const modal = document.createElement("div");
            modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            cursor: pointer;
          `;

            const img = document.createElement("img");
            img.src = src;
            img.style.cssText = `
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          `;

            modal.appendChild(img);
            document.body.appendChild(modal);

            // 点击关闭
            modal.addEventListener("click", () => {
              document.body.removeChild(modal);
            });
          }
        }
      },
      { priority: "high" },
    );
  };

  useImperativeHandle(
    ref,
    () => ({
      focus,
    }),
    [],
  );

  return (
    <CKEditor
      editor={ClassicEditor}
      data={value}
      config={{
        placeholder,
        toolbar: [],
        image: {
          toolbar: [],
          insert: {
            type: "inline",
          },
          resizeUnit: "px",
          resizeOptions: [],
        },
        plugins: [
          Essentials,
          Paragraph,
          Image,
          ImageToolbar,
          ImageUpload,
          ImageCaption,
          ImageStyle,
          ImageResize,
          AutoImage,
        ],
      }}
      onReady={(editor) => {
        ckEditor.current = editor;
        listenKeydown(editor);
        handlePaste(editor);
        handleImageClick(editor);
        focus(true);
      }}
      onChange={(event, editor) => {
        const data = editor.getData();
        onChange?.(data);
      }}
    />
  );
};

export default memo(forwardRef(Index));
