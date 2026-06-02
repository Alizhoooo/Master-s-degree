import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { translations } from '../common/i18n';

@ApiTags('i18n')
@Controller('i18n')
export class I18nController {
  @Get('translations')
  getTranslations(@Query('locale') locale: string = 'en') {
    return translations[locale] || translations.en;
  }

  @Get('locales')
  getLocales() {
    return Object.keys(translations);
  }
}
