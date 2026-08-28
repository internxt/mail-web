import { Button } from '@internxt/ui';
import SmallLogo from '../../assets/logos/Internxt/small-logo.svg?react';
import MailAppImage from '../../assets/images/welcome/welcome-page.webp';
import { useTranslationContext } from '@/i18n';
import { useAuth } from '@/hooks/auth/useAuth';
import { useMailAccess } from '@/hooks/mail/useMailAccess';
import { INTERNXT_BASE_URL } from '@/constants';
import { ErrorService } from '@/services/error';
import { ToastType } from '@/services/notifications';
import { NavigationService } from '@/services/navigation';
import { AppView } from '@/routes/paths';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface WelcomeLocationState {
  planAlreadyNotified?: boolean;
}

const WelcomePage = () => {
  const { translate } = useTranslationContext();
  const { status } = useMailAccess();
  const location = useLocation();
  const isPlanRequired = status === 'plan-required';
  const hasNotifiedPlanRequired = useRef((location.state as WelcomeLocationState | null)?.planAlreadyNotified === true);

  useEffect(() => {
    const hadDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
    return () => {
      if (hadDark) document.documentElement.classList.add('dark');
    };
  }, []);

  useEffect(() => {
    if (!isPlanRequired || hasNotifiedPlanRequired.current) return;

    hasNotifiedPlanRequired.current = true;
    ErrorService.instance.notifyUser(translate('errors.identitySetup.planNotSupported'), ToastType.Warning);
  }, [isPlanRequired, translate]);

  const onSuccess = () => {
    NavigationService.instance.replace({ id: AppView.IdentitySetup });
  };

  const { handleWebLogin, handleWebSignup } = useAuth({
    onSuccess,
    translate,
  });

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-linear-to-r from-gray-5 to-primary/20">
      <div className="flex flex-col max-w-7xl mx-auto">
        <div className="flex flex-row justify-between w-full p-5">
          <div className="flex px-3 py-2 items-center gap-2 rounded-2xl border border-gray-5 bg-surface drop-shadow text-black">
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
        </div>
        <div className="flex flex-row justify-between pt-10">
          <div className="flex flex-col pl-20 w-max max-w-lg pt-20 gap-6">
            <h1 className="text-5xl font-semibold leading-tight">
              <span className="text-primary">{translate('welcome.title.highlighted')}</span> <br />{' '}
              {translate('welcome.title.normal')}
            </h1>
            <p className="tex-xl text-gray-50">{translate('welcome.description')}</p>
            <div className="w-full border border-gray-10" />
            {isPlanRequired && (
              <p className="text-gray-60">
                {translate('planRequired.notice')}{' '}
                <a
                  className="text-primary underline"
                  href={`${INTERNXT_BASE_URL}/pricing`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {translate('planRequired.seePlans')} →
                </a>
              </p>
            )}
          </div>

          <div className="flex translate-x-50">
            <img src={MailAppImage} height={504} width={806} draggable={false} alt="Mail app" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
