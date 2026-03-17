import {
  EnvelopeSimpleIcon,
  FolderSimpleIcon,
  GaugeIcon,
  PaperPlaneTiltIcon,
  ShieldIcon,
  SparkleIcon,
  VideoCameraIcon,
} from '@phosphor-icons/react';
import { type SuiteLauncherProps } from '@internxt/ui';
import { Service } from '@internxt/sdk/dist/drive/payments/types/tiers';
import { useTranslationContext } from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { ConfigService } from '@/services/config';
import { MEET_URL, SEND_URL } from '@/constants';

export const useSuiteLauncher = () => {
  const { translate } = useTranslationContext();
  const userTier = useAppSelector((state) => state.user.userTier);
  const userFeatures = userTier?.featuresPerService;

  const openSuite = (suite: {
    enabled: boolean;
    onOpenSuite: () => void;
    upgradeTitle: string;
    upgradeDescription: string;
  }) => {
    if (suite.enabled) {
      suite.onOpenSuite();
    }
  };

  const suiteArray: SuiteLauncherProps['suiteArray'] = [
    {
      icon: <FolderSimpleIcon />,
      title: 'Drive',
      onClick: () => {
        window.open(ConfigService.instance.getVariable('DRIVE_APP_URL'), '_self', 'noopener');
      },
      isMain: true,
    },
    {
      icon: <VideoCameraIcon />,
      title: 'Meet',
      onClick: () =>
        openSuite({
          enabled: userFeatures?.[Service.Meet]?.enabled ?? false,
          onOpenSuite: () => window.open(MEET_URL, '_blank', 'noopener'),
          upgradeTitle: translate('modals.upgradePlanDialog.meet.title'),
          upgradeDescription: translate('modals.upgradePlanDialog.meet.description'),
        }),
      isLocked: !userFeatures?.[Service.Meet]?.enabled,
    },
    {
      icon: <EnvelopeSimpleIcon />,
      title: 'Mail',
      onClick: () => {},
      availableSoon: true,
      isLocked: !userFeatures?.[Service.Mail]?.enabled,
    },
    {
      icon: <PaperPlaneTiltIcon />,
      title: 'Send',
      onClick: () => {
        window.open(SEND_URL, '_blank', 'noopener');
      },
    },
    {
      icon: <GaugeIcon />,
      title: 'VPN',
      onClick: () =>
        openSuite({
          enabled: userFeatures?.[Service.Vpn]?.enabled ?? false,
          onOpenSuite: () =>
            window.open(
              'https://chromewebstore.google.com/detail/internxt-vpn-free-encrypt/dpggmcodlahmljkhlmpgpdcffdaoccni',
              '_blank',
              'noopener',
            ),
          upgradeTitle: translate('modals.upgradePlanDialog.vpn.title'),
          upgradeDescription: translate('modals.upgradePlanDialog.vpn.description'),
        }),
      isLocked: !userFeatures?.[Service.Vpn]?.enabled,
    },
    {
      icon: <ShieldIcon />,
      title: 'Antivirus',
      onClick: () =>
        openSuite({
          enabled: userFeatures?.[Service.Antivirus]?.enabled ?? false,
          onOpenSuite: () => {
            ConfigService.instance.downloadDesktopApp(translate);
          },
          upgradeTitle: translate('modals.upgradePlanDialog.antivirus.title'),
          upgradeDescription: translate('modals.upgradePlanDialog.antivirus.description'),
        }),
      isLocked: !userFeatures?.[Service.Antivirus]?.enabled,
    },
    {
      icon: <SparkleIcon />,
      title: 'Cleaner',
      onClick: () =>
        openSuite({
          enabled: userFeatures?.[Service.Cleaner].enabled ?? false,
          onOpenSuite: () => {
            ConfigService.instance.downloadDesktopApp(translate);
          },
          upgradeTitle: translate('modals.upgradePlanDialog.cleaner.title'),
          upgradeDescription: translate('modals.upgradePlanDialog.cleaner.description'),
        }),
      isLocked: !userFeatures?.[Service.Cleaner]?.enabled,
    },
  ];

  return {
    suiteArray,
  };
};
