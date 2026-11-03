import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	// optional: the Mapbox demo shows a message when it is not set
	PUBLIC_MAPBOX_ACCESSTOKEN: {
		public: true,
		static: true,
		schema: (value) => value ?? ''
	}
});
