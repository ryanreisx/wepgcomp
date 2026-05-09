import { SetMetadata } from '@nestjs/common';

export const EDITION_ADMIN_KEY = 'editionAdmin';
export const EditionAdmin = () => SetMetadata(EDITION_ADMIN_KEY, true);
