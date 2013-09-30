/**
 * Controller for the Menu Panel
 *
 * Singleton
 */
define(
[
	'emberjs',
	'Library/jquery-with-dependencies',
	'Shared/LocalStorage',
	'Shared/ResourceCache',
	'Shared/Configuration',
	'text!./MenuPanel.html'
], function(Ember, $, LocalStorage, ResourceCache, Configuration, template) {
	return Ember.Object.extend({
		configuration: null,
		menuPanelMode: false,

		items: [],

		init: function() {
			var that = this;
			$.when(ResourceCache.getItem(Configuration.get('MenuDataUri'))).done(function(dataString) {
				var data = JSON.parse(dataString);
				that.set('items', data);
			}).fail(function(xhr, status, error) {
				console.error('Error loading menu data.', xhr, status, error);
			});

			this.set('configuration', LocalStorage.getItem('menuConfiguration') || {});
			Ember.addObserver(this, 'configuration', function() {
				var configuration = this.get('configuration');
				if ($.isEmptyObject(configuration) === false) {
					LocalStorage.setItem('menuConfiguration', configuration);
				}
			});
		},

		toggleCollapsed: function(menuGroup) {
			if (!this.get('configuration.' + menuGroup)) {
				this.set('configuration.' + menuGroup, false);
			}
			var newCollapsedState = this.toggleProperty('configuration.' + menuGroup);
			this.propertyDidChange('configuration');
			return newCollapsedState;
		},

		activeItem: function() {
			var that = this;
			if (location.pathname.substr(0, 6) === '/neos/') {
				var modules = this.get('items.modules');
				if (typeof modules !== 'undefined') {
					$.each(modules, function(moduleIndex, moduleConfiguration) {
						var submoduleMatched = false;
						if (typeof moduleConfiguration.submodules !== 'undefined') {
							$.each(moduleConfiguration.submodules, function(submoduleIndex, submoduleConfiguration) {
								if (location.pathname.indexOf(submoduleConfiguration.modulePath) !== -1) {
									that.set('items.modules.' + moduleIndex + '.submodules.' + submoduleIndex + '.active', true);
									submoduleMatched = true;
								}
							});
						}
						if (submoduleMatched === false) {
							if (location.pathname.indexOf(moduleConfiguration.modulePath) !== -1) {
								that.set('items.modules.' + moduleIndex + '.active', true);
							}
						}
					});
				}
			} else {
				var sites = this.get('items.sites');
				if (typeof sites !== 'undefined') {
					$.each(sites, function(index, value) {
						if (value.uri && value.uri.indexOf(location.hostname) !== -1) {
							that.set('items.sites.' + index + '.active', true);
						}
					});
				}
			}
		}.observes('items').on('init')
	}).create();
});