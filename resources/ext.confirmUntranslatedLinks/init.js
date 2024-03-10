( function () {

	mw.ConfirmUntranslatedLinks = {
		dialog: null,
		windowManager : null,

		initialize: function () {
			return mw.loader.using( ['oojs-ui-windows', 'mediawiki.cookie' ] ).then( function () {

				OO.ui.ConfirmDialogDoNotShowAgain = function OoUiConfirmDialog ( config ) {
					OO.ui.ConfirmDialogDoNotShowAgain.parent.call( this, config );
				}

				OO.inheritClass( OO.ui.ConfirmDialogDoNotShowAgain, OO.ui.MessageDialog );
				OO.ui.ConfirmDialogDoNotShowAgain.static.name = 'ConfirmDoNotShowAgain';
				OO.ui.ConfirmDialogDoNotShowAgain.static.cookieName = 'confirmDoNotShowAgain';

				OO.ui.ConfirmDialogDoNotShowAgain.prototype.initialize = function ( config ) {
					var responsiveField;

					config = config || {};

					OO.ui.ConfirmDialogDoNotShowAgain.parent.prototype.initialize.call( this, config );

					this.doNotShowAgainCheckbox = new OO.ui.CheckboxInputWidget();
					responsiveField = new OO.ui.FieldLayout( this.doNotShowAgainCheckbox, {
						align: 'inline',
						label: OO.ui.msg( 'confirmuntranslatedlinks-confirm-checkbox' )
					} );

					this.text.$element.append( responsiveField.$element );
				};

				OO.ui.ConfirmDialogDoNotShowAgain.prototype.shouldShow = function () {
					var dialogName = name = this.constructor.static.name,
						cookieName = this.constructor.static.cookieName;

					doNotShowAgainValues = JSON.parse( mw.cookie.get( cookieName ) );
					console.log( doNotShowAgainValues );
					this.constructor.doNotShowAgainValues = doNotShowAgainValues || {};
					if ( doNotShowAgainValues && doNotShowAgainValues[dialogName]) {
						return false;
					}

					return true;
				}

				OO.ui.ConfirmDialogDoNotShowAgain.prototype.saveCookie = function () {
					var dialogName = name = this.constructor.static.name,
						cookieName = this.constructor.static.cookieName;
					// Check if "do not show again" is checked, and save cookie
					// As a compromise between having a "bring this back" link somewhere and not ever seeing it,
					// Lets limit this cookie to X months?
					// Please note: this cookie is probably shared between several "do not show again" dialogs
					if ( this.doNotShowAgainCheckbox.isSelected() ) {
						this.constructor.doNotShowAgainValues[dialogName] = 1;
						mw.cookie.set( cookieName, JSON.stringify( this.constructor.doNotShowAgainValues ) );
					}
				}

				OO.ui.ConfirmDialogDoNotShowAgain.prototype.getActionProcess = function ( action ) {
					if ( action === 'accept' ) {
						this.saveCookie();
					}

					return OO.ui.ConfirmDialogDoNotShowAgain.parent.prototype.getActionProcess.call( this, action );
				};

				/**
				 * @inheritdoc
				 */
				OO.ui.ConfirmDialogDoNotShowAgain.prototype.getSetupProcess = function ( data ) {
					data = data || {};

					// Parent method
					return OO.ui.ConfirmDialogDoNotShowAgain.super.prototype.getSetupProcess.call( this, data );
				};


				OO.ui.ConfirmUntranslatedDialog = function (config ) {
					OO.ui.ConfirmUntranslatedDialog.parent.call( this, config );
				}

				OO.inheritClass( OO.ui.ConfirmUntranslatedDialog, OO.ui.ConfirmDialogDoNotShowAgain );
				OO.ui.ConfirmUntranslatedDialog.static.name = 'ConfirmUntranslatedLink';
				OO.ui.ConfirmUntranslatedDialog.static.size = OO.ui.isMobile() ? 'small' : 'medium';
				OO.ui.ConfirmUntranslatedDialog.static.title = OO.ui.msg( 'confirmuntranslatedlinks-confirm-title' );
				OO.ui.ConfirmUntranslatedDialog.static.message = OO.ui.msg( 'confirmuntranslatedlinks-confirm-text' );

				OO.ui.ConfirmUntranslatedDialog.prototype.getActionProcess = function (action ) {
					if ( action === 'accept' ) {
						this.saveCookie();
						// Redirect to the URL this started with
						window.location.href = this.constructor.static.targetUrl;
					} else {
						// Do nothing, the default link behavior was already prevented
					}

					return OO.ui.ConfirmUntranslatedDialog.parent.prototype.getActionProcess.call( this, action );
				};

				/**
				 * @inheritdoc
				 */
				OO.ui.ConfirmUntranslatedDialog.prototype.getSetupProcess = function (data ) {
					// Parent method
					return OO.ui.ConfirmUntranslatedDialog.parent.prototype.getSetupProcess.call( this, data )
						.next( function () {
							OO.ui.ConfirmUntranslatedDialog.static.targetUrl = data.targetUrl;
						}, this );
				};

				// Optionally pass options.name
				mw.confirmUntranslatedLink = function ( targetUrl, options ) {
					var confirmDialog,
						config,
						windowManager = OO.ui.getWindowManager();

					confirmDialog = new OO.ui.ConfirmUntranslatedDialog( config );
					windowManager.addWindows( [ confirmDialog ] );
					return windowManager.openWindow( confirmDialog,	{
							targetUrl: targetUrl
						}
					);
				};
			} );
		},

		registerWindow: function () {
			this.dialog = new OO.ui.ConfirmUntranslatedDialog();
			this.windowManager = OO.ui.getWindowManager();
			this.windowManager.addWindows( [ this.dialog ] );
		},

		openWindow: function( targetUrl ) {
			if ( mw.ConfirmUntranslatedLinks.dialog.shouldShow() ) {
				this.windowManager.openWindow( this.dialog, {
					targetUrl: targetUrl
				});
			} else {
				this.removeClickListener();
				window.location.href = targetUrl;
			}
		},

		removeClickListener: function () {
			document.removeEventListener( 'click', mw.ConfirmUntranslatedLinks.onClick );
		},


		onClick: function ( event ) {
			if ( event.target.matches( '.mw-redirect-extiw' ) ) {
				event.preventDefault();
				if ( !mw.ConfirmUntranslatedLinks.dialog ) {
					mw.ConfirmUntranslatedLinks.initialize().then( function() {
						mw.ConfirmUntranslatedLinks.registerWindow();
						mw.ConfirmUntranslatedLinks.openWindow( event.target.href );
					} )
				} else {
					mw.ConfirmUntranslatedLinks.openWindow( event.target.href );
				}
			}
		}
	}

	document.addEventListener('click', mw.ConfirmUntranslatedLinks.onClick );
}() );
