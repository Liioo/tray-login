;(function($, window, document, undefined) {
    var thatDoc = document,
        thisDoc =  (thatDoc._currentScript || thatDoc.currentScript).ownerDocument,
        template = thisDoc.querySelector('template').content,
        trayLoginProto = Object.create(HTMLElement.prototype),
        thisElement,
        urls = {};

    $(document).on('tray-login', function(event, response, type) {
        if (type === 'finished') {
            window.location = urls.callback;
        }
    });

    if (window.ShadowDOMPolyfill) {
        WebComponents.ShadowCSS.shimStyling(template, 'tray-login');
    }

    trayLoginProto.createdCallback = function() {
        var shadowRoot = this.createShadowRoot();
        var clone = thatDoc.importNode(template, true);
        shadowRoot.appendChild(clone);
        thisElement = this;
        this.addListeners();
        this.setUrls();
        this.shadowRoot.querySelector('#screen-2').style.display = 'none';
    };

    trayLoginProto.setUrls = function() {
        urls.otp = $(this).attr('api-otp');
        urls.otpLogin = $(this).attr('api-otp-login');
        urls.callback = $(this).attr('url-callback');
    };

    trayLoginProto.addListeners = function() {
        this.onCloseElement()
            .onOTPLogin()
            .onChooseOtherOption()
            .onSubmitCode();
    };

    trayLoginProto.onCloseElement = function() {
        this.closeButton = this.shadowRoot.querySelector('.tray-close');

        this.closeButton.addEventListener('click', function(event) {
            event.preventDefault();
            thisElement.style.display = 'none';
        });

        return this;
    };

    trayLoginProto.onOTPLogin = function() {
        this.OTPButton = this.shadowRoot.getElementById('login-otp');
        
        this.OTPButton.addEventListener('click', function(event) {
            event.preventDefault();
            $.ajax({
                type: 'POST',
                url: urls.otp,
                dataType: 'json',
                success: function(response) {
                    thisElement.shadowRoot.getElementById('tray-email').innerHTML = response.data.email;
                    thisElement.shadowRoot.getElementById('input-email').value = response.data.email;
                    thisElement.shadowRoot.getElementById('screen-1').style.display = 'none';
                    thisElement.shadowRoot.getElementById('screen-2').style.display = 'block';
                },
                error: function(request, type) {
                    console.error(request, type);
                }
            });
        });

        return this;
    };

    trayLoginProto.onChooseOtherOption = function() {
        this.otherOptionButton = this.shadowRoot.getElementById('login-other-option');

        this.otherOptionButton.addEventListener('click', function(event) {
            event.preventDefault();
            thisElement.shadowRoot.getElementById('screen-1').style.display = 'block';
            thisElement.shadowRoot.getElementById('screen-2').style.display = 'none';
        });

        return this;
    };

    trayLoginProto.onSubmitCode = function() {
        this.loginForm = this.shadowRoot.getElementById('login-form');

        this.loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            var data = $(this).serialize();
            $.ajax({
                type: 'GET',
                data: data,
                url: urls.otpLogin,
                dataType: 'json',
                success: function(response) {
                    $(document).trigger('tray-login', [response, 'finished']);
                },
                error: function(request, type) {
                    $(document).trigger('tray-login', [request, 'error']);
                }
            });
        });

        return this;
    };

    window.trayLogin = thatDoc.registerElement('tray-login', {
        prototype: trayLoginProto
    });

})(Zepto, window, document);
