import filePDF from '@/assets/icons/file-types/pdf.svg';
import fileWord from '@/assets/icons/file-types/word.svg';
import fileZIP from '@/assets/icons/file-types/zip.svg';
import envelopeBody from '@/assets/images/mail-loading/envelope-body.svg';
import envelopePocket from '@/assets/images/mail-loading/envelope-pocket.svg';
import envelopeFlap from '@/assets/images/mail-loading/envelope-flap.svg';
import { useTranslationContext } from '@/i18n';
import { useAppLoaderAnimation } from './useAppLoaderAnimation';

interface AppLoaderProps {
  className?: string;
}

export const AppLoader = ({ className = 'h-full w-full' }: AppLoaderProps) => {
  const { translate } = useTranslationContext();
  const { isFlapOpen, filesOut } = useAppLoaderAnimation();

  return (
    <div className={`flex ${className} cursor-default flex-col items-center justify-center bg-gray-1`}>
      <div className="pointer-events-none relative mb-4 h-29.5 w-52" style={{ perspective: '600px' }}>
        <img
          className="absolute left-0 top-0 h-full w-full object-contain"
          style={{ zIndex: 1 }}
          src={envelopeBody}
          alt=""
        />

        <img
          className="absolute left-0 top-0 h-full w-full object-contain transition-transform duration-300 ease-in-out"
          style={{
            transformOrigin: 'center 6.8%',
            transform: isFlapOpen ? 'rotateX(-165deg)' : 'rotateX(0deg)',
            zIndex: isFlapOpen ? 2 : 40,
          }}
          src={envelopeFlap}
          alt=""
        />

        <img
          className={`absolute z-3 h-14 w-14 object-contain transition-all duration-300 ease-in-out
          ${
            filesOut
              ? 'left-1/3 top-1 -translate-x-8 -rotate-12 scale-100'
              : 'left-1/3 top-11 -translate-x-2 -rotate-12 scale-50'
          }`}
          src={filePDF}
          alt=""
        />
        <img
          className={`absolute z-3 h-14 w-14 object-contain transition-all duration-300 ease-in-out
          ${
            filesOut
              ? 'left-1/2 top-2 -translate-x-6 rotate-3 scale-100'
              : 'left-1/2 top-9 -translate-x-8 rotate-3 scale-50'
          }`}
          src={fileWord}
          alt=""
        />
        <img
          className={`absolute z-3 h-14 w-14 object-contain transition-all duration-300 ease-in-out
          ${
            filesOut
              ? 'left-1/2 top-3 translate-x-2 rotate-[30deg] scale-100'
              : 'left-1/2 top-9 -translate-x-6 rotate-[30deg] scale-50'
          }`}
          src={fileZIP}
          alt=""
        />

        <img
          className="absolute left-0 top-0 h-full w-full object-contain"
          style={{ zIndex: 4 }}
          src={envelopePocket}
          alt=""
        />
      </div>

      <div className="flex flex-col items-center justify-center">
        <p className="text-2xl font-semibold text-gray-90">{translate('appLoader.title')}</p>
        <div className="relative text-base font-medium text-gray-40">{translate('appLoader.subtitle')}</div>
      </div>
    </div>
  );
};

export default AppLoader;
