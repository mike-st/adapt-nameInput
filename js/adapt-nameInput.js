define([ "coreJS/adapt" ], function(Adapt) {

    var NameInput = Backbone.View.extend({

        initialize: function() {
            this.listenTo(Adapt, "app:dataReady", this._onDataReady);
        },

        _onDataReady: function() {
            var config = Adapt.config.get("_nameInput");
            if (!config || !config._isEnabled) return;

            // Check first launch of course
            $('html').addClass('nameInput');
            this.listenToOnce(Adapt, "router:location", this.checkBookmark);
        },

        checkBookmark: function() {
          this._isEnabled = Adapt.course.get("_nameInput");
          var isEnabled = (this._isEnabled);
          if (!isEnabled){
            return this._disabled();
          }
          // Check first launch of course
          if((Adapt.offlineStorage.get("location") === "undefined") || (Adapt.offlineStorage.get("location") === undefined) || (Adapt.offlineStorage.get("location") == "")) {
            if (Adapt.course.get('_nameInput')._isEnabled) {
                this.listenToOnce(Adapt, {
                    'remove': this._onRemove,
                    'router:menu router:page': this._onRouterEvent
                });
            }
            // Presume there is a bookmark
          } else {
            if(Adapt.course.get('_bookmarking')._isEnabled) {
              console.log("NameInput has not opened because of bookmarking");
              this.listenToOnce(Adapt, 'notify:closed', this.notifyClosed);
            }
          }
        },

        notifyClosed: function() {
            this.listenToOnce(Adapt, {
                'remove': this._onRemove,
                'router:menu router:page': this._onRouterEvent
            });
        },

        _onRouterEvent: function(model) {
            this._config = model.get("_nameInput");
            var isEnabled = (this._config && this._config._isEnabled);
            if (!isEnabled) return this._disabled();
            this._enabled();
        },

        _onRemove: function() {
            this._disabled();
        },

        _disabled: function() {
            if (this._dataEvent) {
                this._dataEvent = null;
            }
        },

        _enabled: function() {
            this.onNamespotShow();
        },

        onNamespotShow: function() {
            var delayinsec = parseInt(Adapt.course.get('_nameInput')._delay*100);
            var template = Handlebars.templates['nameInputNotify'];
            var nameholder = this._config;
            // Get username from storage and add it to the nameholder object for processing in hbs template
            nameholder._userName = Adapt.offlineStorage.get("userName");

            // Listen for the prompt events added to promptObject
            this.listenToOnce(Adapt, "nameholder:continue", this.nameholderContinue);
            this.listenToOnce(Adapt, "nameholder:cancel", this.nameholderCancel);

            var promptObject = {
                title: nameholder._prompt.title,
                body: template(nameholder),
                _prompts: [
                    {
                        promptText: nameholder._buttons.no,
                        _callbackEvent: "nameholder:cancel",
                    },
                    {
                        promptText: nameholder._buttons.yes,
                        _callbackEvent: "nameholder:continue",
                    },
                ]
            };

            _.delay(function() {
                $(".loading").hide();
                $("body").removeAttr("aria-hidden");
                Adapt.trigger('notify:prompt', promptObject);
            }, delayinsec);
        },

        nameholderCancel: function() {
            // Just remove the event listener, the modal will close automagically
            var userName = "Default Learner";
            Adapt.offlineStorage.set('userName', userName);
            $('.nameInput head').append("<style>.inputs-name-here:before {content:'" + userName + "'}</style>");
            this.stopListening(Adapt, "nameholder:cancel");
            $( "button.hotspot-menu-item.nth-child-1" ).trigger( "click" );
        },

        nameholderContinue: function() {
            // Check a name was entered
            var userName = $('#assessment-nameholder-user-name').val();
            var isValid = /[A-Za-z\-\s]{2,}/.test(userName);

            if (isValid) {
                // Add the username to the LMS
                Adapt.offlineStorage.set('userName', userName);
                $('.nameInput head').append("<style>.inputs-name-here:before {content:'" + userName + "'}</style>");
                this.stopListening(Adapt, "nameholder:continue");
                $( "button.hotspot-menu-item.nth-child-1" ).trigger( "click" );
            }
            else {
                this.onNamespotShow();
            }
        }

    });

    return new NameInput();
});
