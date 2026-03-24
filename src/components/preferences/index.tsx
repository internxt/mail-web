import { usePreferencesNavigation } from '@/hooks/preferences/usePreferencesNavigation';
import { useTranslationContext } from '@/i18n';
import { Modal } from '@internxt/ui';
import { useEffect } from 'react';
import SectionListWrapper from './components/SectionListWrapper';

export const PreferencesDialog = () => {
  const { translate } = useTranslationContext();
  const { isOpen, activePath, openSection, close } = usePreferencesNavigation();

  const title = translate(`modals.preferences.sections.${activePath.subsection ?? activePath.section}.title`);

  useEffect(() => {
    if (isOpen) {
      document.title = `${title} | Internxt Mail`;
    }
  }, [isOpen, title]);

  return (
    <Modal
      maxWidth="max-w-4xl"
      className="m-0 flex max-h-640 h-screen overflow-hidden shadow-sm"
      isOpen={isOpen}
      onClose={close}
    >
      <section className="w-56 shrink-0 border-r border-gray-10 px-2.5">
        <h1 className="py-3 pl-4 text-xl font-semibold">{translate('modals.preferences.title')}</h1>
        <SectionListWrapper activePath={activePath} onSelectSection={openSection} />
      </section>
    </Modal>
  );
};
