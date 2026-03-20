import DOMPurify from 'dompurify';

const purify = DOMPurify();

purify.addHook('afterSanitizeAttributes', (node) => {
  const tag = node.tagName?.toLowerCase();

  if (tag === 'img' || tag === 'video' || tag === 'audio' || tag === 'source') {
    const src = node.getAttribute('src') ?? '';
    if (src && !src.startsWith('data:') && !src.startsWith('cid:')) {
      node.removeAttribute('src');
    }
  }

  if (node.hasAttribute('background')) {
    const bg = node.getAttribute('background') ?? '';
    if (bg && !bg.startsWith('data:') && !bg.startsWith('cid:')) {
      node.removeAttribute('background');
    }
  }

  if (tag === 'a') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

interface PreviewProps {
  subject: string;
  body: string;
  attachments?: string[];
}

const Preview = ({ subject, body, attachments }: PreviewProps) => {
  const sanitizedBody = purify.sanitize(body);

  return (
    <div className="flex flex-col w-full p-5">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-2xl font-semibold text-gray-100">{subject}</h2>
        <div className="prose text-gray-100" dangerouslySetInnerHTML={{ __html: sanitizedBody }} />
      </div>

      {attachments?.map((attachment) => (
        <div key={attachment}>
          <a href={attachment} target="_blank" rel="noreferrer">
            {attachment}
          </a>
        </div>
      ))}
    </div>
  );
};

export default Preview;
