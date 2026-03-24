import { usePreferencesNavigation } from '@/hooks/preferences/usePreferencesNavigation';
import { useTranslationContext } from '@/i18n';
import type { PreferencesSection } from '@/types/preferences';
import { Modal } from '@internxt/ui';
import type { FC } from 'react';
import { useEffect } from 'react';
import SectionListWrapper from './components/SectionListWrapper';
import GeneralSection from './sections/general';

const SECTION_COMPONENTS: Record<PreferencesSection, FC<{ onClose: () => void }>> = {
  general: GeneralSection,
};

export const PreferencesDialog = () => {
  const { translate } = useTranslationContext();
  const { isOpen, activeSection, openSection, close } = usePreferencesNavigation();

  const title = translate(`modals.preferences.sections.${activeSection}.title`);

  useEffect(() => {
    if (isOpen) {
      document.title = `${title} | Internxt Mail`;
    }
  }, [isOpen, title]);

  const ActiveSectionComponent = SECTION_COMPONENTS[activeSection];

  return (
    <Modal
      maxWidth="max-w-4xl"
      className="m-0 flex max-h-640 h-screen overflow-hidden shadow-sm"
      isOpen={isOpen}
      onClose={close}
    >
      <section className="w-56 shrink-0 border-r border-gray-10 px-2.5">
        <h1 className="py-3 pl-4 text-xl font-semibold">{translate('modals.preferences.title')}</h1>
        <SectionListWrapper activeSection={activeSection} onSelectSection={openSection} />
      </section>

      <ActiveSectionComponent onClose={close} />
    </Modal>
  );
};
