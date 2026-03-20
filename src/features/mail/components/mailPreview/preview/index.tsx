import DOMPurify from 'dompurify';

interface PreviewProps {
  subject: string;
  body: string;
  attachments?: string[];
}

const Preview = ({ subject, body, attachments }: PreviewProps) => {
  const sanitizedBody = DOMPurify.sanitize(body);

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
