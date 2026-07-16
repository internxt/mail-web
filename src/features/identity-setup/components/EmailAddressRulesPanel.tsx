import { useTranslationContext } from '@/i18n';
import { CheckCircleIcon, MinusCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import type { EmailAddressRule, EmailAddressRuleStatus } from '../hooks/emailAddressRules';

interface EmailAddressRulesPanelProps {
  rules: EmailAddressRule[];
}

const STATUS_TEXT_CLASSNAME: Record<EmailAddressRuleStatus, string> = {
  idle: 'text-gray-50',
  valid: 'text-green',
  invalid: 'text-red',
};

const STATUS_ICON: Record<EmailAddressRuleStatus, typeof CheckCircleIcon> = {
  idle: MinusCircleIcon,
  valid: CheckCircleIcon,
  invalid: XCircleIcon,
};

export const EmailAddressRulesPanel = ({ rules }: EmailAddressRulesPanelProps) => {
  const { translate } = useTranslationContext();

  return (
    <ul className="flex flex-col gap-1.5 pt-3">
      {rules.map((rule) => {
        const StatusIcon = STATUS_ICON[rule.status];

        return (
          <li key={rule.id} className={`flex items-center gap-2 text-sm ${STATUS_TEXT_CLASSNAME[rule.status]}`}>
            <StatusIcon size={16} weight="fill" className="shrink-0" />
            {translate(rule.labelKey)}
          </li>
        );
      })}
    </ul>
  );
};

export default EmailAddressRulesPanel;
