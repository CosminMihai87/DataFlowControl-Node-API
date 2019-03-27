#!/bin/bash

# https://blog.didierstevens.com/2015/03/30/howto-make-your-own-cert-with-openssl-on-windows/

# set the config environment variable:
set OPENSSL_CONF=C:\OpenSSL-Win64\bin\cnf\openssl.cnf

# First we generate a 4096-bit long RSA key for our root CA and store it in file ca.key:
# If you want to password-protect this key, add option -des3.
openssl genrsa -out ca.key 4096

# Next, we create our self-signed root CA certificate ca.crt; you’ll need to provide an identity for your root CA:
# The -x509 option is used for a self-signed certificate. 1826 days gives us a cert valid for 5 years.
openssl req -new -x509 -days 1826 -key ca.key -out ca.crt

# Next step: create our subordinate CA that will be used for the actual signing. First, generate the key:
openssl genrsa -out ia.key 4096

# Then, request a certificate for this subordinate CA:
# Make sure that the Common Name you enter here is different from the Common Name you entered previously for the root CA. If they are the same, you will get an error later on when creating the pkcs12 file.
openssl req -new -key ia.key -out ia.csr

# Next step: process the request for the subordinate CA certificate and get it signed by the root CA.
# The cert will be valid for 2 years (730 days) and I decided to choose my own serial number 01 for this cert (-set_serial 01). For the root CA, I let OpenSSL generate a random serial number.
openssl x509 -req -days 730 -in ia.csr -CA ca.crt -CAkey ca.key -set_serial 01 -out ia.crt



echo "Done." 
echo
echo "----- Don't forget to open your browser and install your $CA_CERT and $CLIENT_P12 certificates -----"