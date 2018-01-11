/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
* @module easy-image/cloudservicesuploadadapter
*/

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import FileRepository from '@ckeditor/ckeditor5-upload/src/filerepository';
import UploadGateway from '@ckeditor/ckeditor-cloudservices-core/src/uploadgateway/uploadgateway';
import CloudServices from '@ckeditor/ckeditor5-cloudservices/src/cloudservices';

/**
 * A plugin which enables upload to Cloud Services.
 *
 * It is mainly used by the {@link module:easy-image/easyimage~EasyImage} feature.
 *
 * After enabling this adapter you need to configure the Cloud Services integration through
 * {@link module:cloudservices/cloudservices~CloudServicesConfig `config.cloudServices`}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class CloudServicesUploadAdapter extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileRepository, CloudServices ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		const cloudServices = editor.plugins.get( CloudServices );

		const token = cloudServices.token;
		const uploadUrl = cloudServices.uploadUrl;

		if ( !token ) {
			return;
		}

		this._uploadGateway = new CloudServicesUploadAdapter._UploadGateway( token, uploadUrl );

		editor.plugins.get( FileRepository ).createAdapter = loader => {
			return new Adapter( this._uploadGateway, loader );
		};
	}
}

/**
 * @private
 */
class Adapter {
	constructor( uploadGateway, loader ) {
		this.uploadGateway = uploadGateway;

		this.loader = loader;
	}

	upload() {
		this.fileUploader = this.uploadGateway.upload( this.loader.file );

		this.fileUploader.on( 'progress', ( evt, data ) => {
			this.loader.uploadTotal = data.total;
			this.loader.uploaded = data.uploaded;
		} );

		return this.fileUploader.send();
	}

	abort() {
		this.fileUploader.abort();
	}
}

// Store the API in static property to easily overwrite it in tests.
// Too bad dependency injection does not work in Webpack + ES 6 (const) + Babel.
CloudServicesUploadAdapter._UploadGateway = UploadGateway;
