# Timelock Explorer

This repository contains the source code for the Timelock Explorer, an open-source reference implementation for unlocking Timelock Accounts created by the Code Wallet App. These accounts are based on a smart contract and can be accessed using your Access Key, enabling you to transfer your funds to other Solana wallets. The Timelock Explorer should only be used as a last resort option if you are unable to utilise the Code Wallet App.

Live Demo: https://code-wallet.github.io/timelock-explorer/

In order to use the Timelock Explorer, you will need to connect a fee paying wallet to fund the SOL transaction fees for the unlock transactions. The codebase uses the standard Solana wallet adapter for the fee paying wallet, so you can use any wallet that is supported by the Solana wallet adapter. For more information on Solana transaction fees, you can visit the official Solana documentation at https://docs.solana.com/transaction_fees.

It is important to be cautious when using the Timelock Explorer or its derivatives, as it requires your Access Key to function. **`Entering your Access Key into an untrusted website or app can result in the loss of your funds, as the website will have full access to your accounts`**. To verify the security of the Timelock Explorer, you can look at the open source code or ask someone you trust to review it for you.

For more information on the Timelock Explorer and related topics, please visit
the website at www.getcode.com/technicalFAQ.

## Legal Disclaimer

DISCLAIMER OF WARRANTY: The Timelock Explorer is provided on an "as is" basis without any warranties of any kind, either express or implied including without limitation warranties of merchantability, fitness for a particular purpose, or non-infringement. CODE INC. DISCLAIM ALL WARRANTIES INCLUDING WITHOUT LIMITATION ANY WARRANTIES OF ACCURACY, COMPLETENESS, RELIABILITY, OR SUITABILITY. IN NO EVENT SHALL CODE INC. BE LIABLE FOR ANY DAMAGES INCLUDING WITHOUT LIMITATION DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR SIMILAR DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING OUT OF THE USE OR INABILITY TO USE THE TIMELOCK EXPLORER OR FOR ANY OTHER CLAIM BY THE USER OR ANY OTHER PARTY.

LIMITATION OF LIABILITY: THE USER ASSUMES ALL RISKS AND RESPONSIBILITIES WHEN USING THE TIMELOCK EXPLORER. CODE INC. CANNOT BE HELD RESPONSIBLE FOR ANY DAMAGES OR LOSSES INCURRED FROM THE USE OF THE TIMELOCK EXPLORER. THE USER IS SOLELY RESPONSIBLE FOR ENSURING THE SECURITY OF THEIR ACCESS KEY AND FUNDS. THE TIMELOCK EXPLORER IS PROVIDED AS AN EXAMPLE IMPLEMENTATION ONLY AND IS NOT INTENDED FOR PRODUCTION USE. CODE INC. AND THE DEVELOPMENT TEAM SHALL HAVE NO LIABILITY FOR ANY ERRORS, OMISSIONS, OR INACCURACIES IN THE INFORMATION PROVIDED.

Please view the full Terms of Use at https://www.getcode.com/terms.

## Security and Issue Disclosures

In the interest of protecting the security of our users and their funds, we ask
that if you discover any security vulnerabilities in the Timelock Explorer, the
on-chain smart contract, or the mobile app, please report them use this [Report
a Vulnerability](https://github.com/code-wallet/timelock-explorer/security/advisories/new)
link. Our security team will review your report. Your cooperation in maintaining
the security of our products is appreciated.

Please view the full Security Policy at https://github.com/code-wallet/timelock-explorer/blob/main/SECURITY.md.
