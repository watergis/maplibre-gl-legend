import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';
import { isDarkMode } from './mode';

addons.setConfig({ theme: isDarkMode() ? themes.dark : themes.light });
