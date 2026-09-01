import { Button } from '@internxt/ui';
import SmallLogo from '../../assets/logos/Internxt/small-logo.svg?react';
import MailAppImage from '../../assets/images/welcome/welcome-page.webp';
import { useTranslationContext } from '@/i18n';
import { useAuth } from '@/hooks/auth/useAuth';
import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import { useEffect } from 'react';

const WelcomePage = () => {
  const { translate } = useTranslationContext();

  useEffect(() => {
    const hadDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
    return () => {
      if (hadDark) document.documentElement.classList.add('dark');
    };
  }, []);

  const onSuccess = () => {
    NavigationService.instance.replace({ id: AppView.IdentitySetup });
  };

  const { handleWebLogin, handleWebSignup } = useAuth({
    onSuccess,
    translate,
  });

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-linear-to-r from-gray-5 to-primary/20">
      <header className="mx-auto flex w-full max-w-400 flex-row items-center justify-between px-6 py-5 lg:px-12 2xl:max-w-650 2xl:px-16">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-5 bg-surface px-3 py-2 text-black drop-shadow">
          <SmallLogo />
          <p>{translate('title')}</p>
        </div>
        <div className="flex flex-row gap-4">
          <Button variant="secondary" onClick={handleWebLogin}>
            {translate('actions.logIn')}
          </Button>
          <Button variant="primary" onClick={handleWebSignup}>
            {translate('actions.signUp')}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-400 flex-1 items-center overflow-hidden px-6 pb-10 lg:px-12 2xl:max-w-650 2xl:px-16">
        <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:gap-12 2xl:gap-16">
          <div className="flex w-full max-w-2xl shrink-0 flex-col gap-6 lg:w-auto lg:max-w-136 lg:gap-8 2xl:max-w-160 2xl:gap-10">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-[clamp(3rem,4.2vw,5rem)]">
              <span className="text-primary">{translate('welcome.title.highlighted')}</span> <br />{' '}
              {translate('welcome.title.normal')}
            </h1>
            <p className="text-lg text-gray-50 lg:text-[clamp(1.125rem,1.15vw,1.75rem)]">
              {translate('welcome.description')}
            </p>
            <div className="w-full border-t border-gray-10" />
          </div>

          <div className="flex min-w-0 flex-1 justify-center lg:justify-start min-[1800px]:-mr-16">
            <img
              src={MailAppImage}
              width={1765}
              height={1160}
              draggable={false}
              alt="Mail app"
              className="h-auto max-h-[calc(100vh-25rem)] w-full max-w-2xl object-contain lg:max-h-[calc(100vh-9rem)] lg:w-[64vw] lg:max-w-none lg:object-left xl:w-[66vw] 2xl:w-[62vw] min-[1800px]:max-w-[min(100%,1765px)]"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;
