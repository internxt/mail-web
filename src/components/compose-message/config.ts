/* eslint-disable @typescript-eslint/no-explicit-any */
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from './extensions/font-size';
import i18next from 'i18next';
import notificationsService, { ToastType } from '@/services/notifications';
import { bytesToString } from '@/utils/bytes-to-string';
import { MAX_INLINE_IMAGE_BYTES } from '@/constants';

export const FONTS = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
];

export const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32'];

export const COLORS = [
  '#000000',
  '#434343',
  '#666666',
  '#999999',
  '#CCCCCC',
  '#EFEFEF',
  '#F3F3F3',
  '#FFFFFF',
  '#FF0000',
  '#FF9900',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#0000FF',
  '#9900FF',
  '#FF00FF',
];

export const EDITOR_CONFIG = {
  editable: true,
  extensions: [
    StarterKit.configure({
      bulletList: {
        keepMarks: true,
        keepAttributes: true,
        HTMLAttributes: {
          class: 'list-disc ml-4',
        },
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: true,
        HTMLAttributes: {
          class: 'list-decimal ml-4',
        },
      },
      listItem: {
        HTMLAttributes: {
          class: 'ml-2',
        },
      },
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary underline',
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto',
      },
    }),
    TextStyle,
    Color,
    FontFamily,
    FontSize,
  ],
  editorProps: {
    attributes: {
      class: 'mail-content focus:outline-none h-full',
    },
    handleDrop: (view: any, event: any, _slice: any, moved: boolean) => {
      if (moved) return false;

      const files = Array.from(event.dataTransfer?.files ?? []) as File[];
      const allImages = files.filter((file) => file.type.startsWith('image/'));
      if (allImages.length === 0) return false;

      event.preventDefault();

      const images = allImages.filter((file) => file.size <= MAX_INLINE_IMAGE_BYTES);
      if (images.length < allImages.length) {
        notificationsService.show({
          text: i18next.t('modals.composeMessageDialog.errors.inlineImageTooLarge', {
            maxSize: bytesToString({ size: MAX_INLINE_IMAGE_BYTES }),
          }),
          type: ToastType.Warning,
        });
      }

      const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
      const pos = coords?.pos ?? view.state.selection.from;

      images.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== 'string') return;
          const node = view.state.schema.nodes.image.create({ src: reader.result });
          view.dispatch(view.state.tr.insert(pos, node));
        };
        reader.readAsDataURL(file);
      });
      return true;
    },
    handlePaste: (view: any, event: any) => {
      const text = event.clipboardData?.getData('text/plain');
      const { from, to } = view.state.selection;
      const hasSelection = from !== to;

      if (text && hasSelection) {
        const urlPattern = /^(https?:\/\/|www\.)[^\s]+$/i;
        if (urlPattern.test(text)) {
          const url = text.startsWith('www.') ? `https://${text}` : text;
          view.dispatch(view.state.tr.addMark(from, to, view.state.schema.marks.link.create({ href: url })));
          return true;
        }
      }
      return false;
    },
  },
};
