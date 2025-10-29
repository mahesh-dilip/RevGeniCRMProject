export function interpolateTemplate(template: string, data: any): string {
  return template.replace(/\{\{(\w+\.?\w*)\}\}/g, (match, key) => {
    const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], data);
    return value !== undefined ? String(value) : match;
  });
}

export function getAvailableVariables(): string[] {
  return [
    '{{company.name}}',
    '{{company.industry}}',
    '{{company.geography}}',
    '{{person.firstName}}',
    '{{person.lastName}}',
    '{{person.title}}',
    '{{deal.title}}',
    '{{deal.value}}',
  ];
}
