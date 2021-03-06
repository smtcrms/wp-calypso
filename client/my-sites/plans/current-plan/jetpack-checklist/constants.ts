/**
 * External dependencies
 */
import { translate } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { SiteSlug, URL } from 'types';

/**
 * Returns the localized duration of a task in given minutes.
 *
 * @param  minutes Number of minutes.
 * @return Localized duration.
 */
export function getJetpackChecklistTaskDuration( minutes: number ): string {
	return translate( '%d minute', '%d minutes', { count: minutes, args: [ minutes ] } );
}

interface TaskUiDescription {
	readonly title: string;
	readonly description?: string;
	readonly completedButtonText: string;
	readonly completedTitle?: string;
	readonly getUrl: ( siteSlug: SiteSlug, isComplete?: boolean ) => URL;
	readonly duration?: string;
	readonly tourId?: string;
}

export interface ChecklistTasksetUi {
	[taskId: string]: TaskUiDescription;
}

export const JETPACK_SECURITY_CHECKLIST_TASKS: Readonly< ChecklistTasksetUi > = {
	jetpack_monitor: {
		title: translate( 'Downtime Monitoring' ),
		description: translate(
			"Monitor your site's uptime and alert you the moment downtime is detected with instant notifications."
		),
		completedButtonText: translate( 'Change', { context: 'verb' } ),
		completedTitle: translate( 'You turned on Downtime Monitoring.' ),
		getUrl: siteSlug => `/settings/security/${ siteSlug }`,
		duration: getJetpackChecklistTaskDuration( 3 ),
		tourId: 'jetpackMonitoring',
	},
	jetpack_plugin_updates: {
		title: translate( 'Automatic Plugin Updates' ),
		description: translate(
			'Choose which WordPress plugins you want to keep automatically updated.'
		),
		completedButtonText: translate( 'Change', { context: 'verb' } ),
		completedTitle: translate( 'You turned on automatic plugin updates.' ),
		getUrl: siteSlug => `/plugins/manage/${ siteSlug }`,
		duration: getJetpackChecklistTaskDuration( 3 ),
		tourId: 'jetpackPluginUpdates',
	},
	jetpack_sign_in: {
		title: translate( 'WordPress.com sign in' ),
		description: translate(
			'Manage your log in preferences and two-factor authentication settings.'
		),
		completedButtonText: translate( 'Change', { context: 'verb' } ),
		completedTitle: translate( 'You completed your sign in preferences.' ),
		getUrl: siteSlug => `/settings/security/${ siteSlug }`,
		duration: getJetpackChecklistTaskDuration( 3 ),
		tourId: 'jetpackSignIn',
	},
};

export const JETPACK_PERFORMANCE_CHECKLIST_TASKS: Readonly< ChecklistTasksetUi > = {
	jetpack_site_accelerator: {
		title: translate( 'Site Accelerator' ),
		description: translate(
			'Serve your images and static files through our global CDN and watch your page load time drop.'
		),
		getUrl: siteSlug => `/settings/performance/${ siteSlug }`,
		completedButtonText: translate( 'Configure' ),
		completedTitle: translate(
			'Site accelerator is serving your images and static files through our global CDN.'
		),
		duration: getJetpackChecklistTaskDuration( 1 ),
		tourId: 'jetpackSiteAccelerator',
	},
	jetpack_lazy_images: {
		title: translate( 'Lazy Load Images' ),
		description: translate(
			"Improve your site's speed by only loading images when visible on the screen."
		),
		getUrl: ( siteSlug, isComplete ) =>
			isComplete ? `/media/${ siteSlug }` : `/settings/performance/${ siteSlug }`,
		completedButtonText: translate( 'Upload images' ),
		completedTitle: translate( 'Lazy load images is improving your site speed.' ),
		duration: getJetpackChecklistTaskDuration( 1 ),
		tourId: 'jetpackLazyImages',
	},
};

export const JETPACK_CHECKLIST_TASK_AKISMET: TaskUiDescription = {
	title: translate( "We're automatically turning on spam filtering." ),
	completedButtonText: translate( 'View spam stats' ),
	completedTitle: translate( "We've automatically turned on spam filtering." ),
	getUrl: siteSlug =>
		`//${ siteSlug.replace( '::', '/' ) }/wp-admin/admin.php?page=akismet-key-config`,
};

export const JETPACK_CHECKLIST_TASK_PROTECT: TaskUiDescription = {
	title: translate( "We've automatically protected you from brute force login attacks." ),
	completedButtonText: translate( 'Configure' ),
	getUrl: siteSlug => `/settings/security/${ siteSlug }`,
};

export const JETPACK_CHECKLIST_TASK_BACKUPS_REWIND: TaskUiDescription = {
	title: translate( 'Backup and Scan' ),
	description: translate(
		"Connect your site's server to Jetpack to perform backups, restores, and security scans."
	),
	completedButtonText: translate( 'Change', { context: 'verb' } ),
	completedTitle: translate( 'You turned on Backup and Scan.' ),
	getUrl: siteSlug => `/settings/security/${ siteSlug }`,
	duration: getJetpackChecklistTaskDuration( 3 ),
};

export const JETPACK_CHECKLIST_TASK_BACKUPS_VAULTPRESS: TaskUiDescription = {
	title: translate( "We're automatically turning on Backup and Scan." ),
	completedTitle: translate( "We've automatically turned on Backup and Scan." ),
	completedButtonText: translate( 'View security dashboard' ),
	getUrl: () => 'https://dashboard.vaultpress.com',
};
