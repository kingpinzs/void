/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { isUndefined } from 'vs/base/common/types';
import { Event } from 'vs/base/common/event';
import { localize, localize2 } from 'vs/nls';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IUserDataProfile, IUserDataProfileOptions, IUserDataProfileUpdateOptions, ProfileResourceType, ProfileResourceTypeFlags } from 'vs/platform/userDataProfile/common/userDataProfile';
import { RawContextKey } from 'vs/platform/contextkey/common/contextkey';
import { URI } from 'vs/base/common/uri';
import { registerIcon } from 'vs/platform/theme/common/iconRegistry';
import { Codicon } from 'vs/base/common/codicons';
import { ITreeItem, ITreeItemLabel } from 'vs/workbench/common/views';
import { CancellationToken } from 'vs/base/common/cancellation';
import { IDisposable } from 'vs/base/common/lifecycle';
import { IProductService } from 'vs/platform/product/common/productService';

export interface DidChangeUserDataProfileEvent {
	readonly previous: IUserDataProfile;
	readonly profile: IUserDataProfile;
	join(promise: Promise<void>): void;
}

export const IUserDataProfileService = createDecorator<IUserDataProfileService>('IUserDataProfileService');
export interface IUserDataProfileService {
	readonly _serviceBrand: undefined;
	readonly currentProfile: IUserDataProfile;
	readonly onDidChangeCurrentProfile: Event<DidChangeUserDataProfileEvent>;
	updateCurrentProfile(currentProfile: IUserDataProfile): Promise<void>;
	getShortName(profile: IUserDataProfile): string;
}

export interface IProfileTemplateInfo {
	readonly name: string;
	readonly url: string;
}

export const IUserDataProfileManagementService = createDecorator<IUserDataProfileManagementService>('IUserDataProfileManagementService');
export interface IUserDataProfileManagementService {
	readonly _serviceBrand: undefined;

	createProfile(name: string, options?: IUserDataProfileOptions): Promise<IUserDataProfile>;
	createAndEnterProfile(name: string, options?: IUserDataProfileOptions): Promise<IUserDataProfile>;
	createAndEnterTransientProfile(): Promise<IUserDataProfile>;
	removeProfile(profile: IUserDataProfile): Promise<void>;
	updateProfile(profile: IUserDataProfile, updateOptions: IUserDataProfileUpdateOptions): Promise<IUserDataProfile>;
	switchProfile(profile: IUserDataProfile): Promise<void>;
	getBuiltinProfileTemplates(): Promise<IProfileTemplateInfo[]>;

}

export interface IUserDataProfileTemplate {
	readonly name: string;
	readonly icon?: string;
	readonly settings?: string;
	readonly keybindings?: string;
	readonly tasks?: string;
	readonly snippets?: string;
	readonly globalState?: string;
	readonly extensions?: string;
}

export function isUserDataProfileTemplate(thing: unknown): thing is IUserDataProfileTemplate {
	const candidate = thing as IUserDataProfileTemplate | undefined;

	return !!(candidate && typeof candidate === 'object'
		&& (isUndefined(candidate.settings) || typeof candidate.settings === 'string')
		&& (isUndefined(candidate.globalState) || typeof candidate.globalState === 'string')
		&& (isUndefined(candidate.extensions) || typeof candidate.extensions === 'string'));
}

export const PROFILE_URL_AUTHORITY = 'profile';
export function toUserDataProfileUri(path: string, productService: IProductService): URI {
	return URI.from({
		scheme: productService.urlProtocol,
		authority: PROFILE_URL_AUTHORITY,
		path: path.startsWith('/') ? path : `/${path}`
	});
}

export const PROFILE_URL_AUTHORITY_PREFIX = 'profile-';
export function isProfileURL(uri: URI): boolean {
	return uri.authority === PROFILE_URL_AUTHORITY || new RegExp(`^${PROFILE_URL_AUTHORITY_PREFIX}`).test(uri.authority);
}

export interface IUserDataProfileCreateOptions extends IUserDataProfileOptions {
	readonly name?: string;
	readonly resourceTypeFlags?: ProfileResourceTypeFlags;
}

export interface IProfileImportOptions extends IUserDataProfileCreateOptions {
	readonly name?: string;
	readonly icon?: string;
	readonly mode?: 'apply';
}

export const IUserDataProfileImportExportService = createDecorator<IUserDataProfileImportExportService>('IUserDataProfileImportExportService');
export interface IUserDataProfileImportExportService {
	readonly _serviceBrand: undefined;

	registerProfileContentHandler(id: string, profileContentHandler: IUserDataProfileContentHandler): IDisposable;
	unregisterProfileContentHandler(id: string): void;

	resolveProfileTemplate(uri: URI): Promise<IUserDataProfileTemplate | null>;
	exportProfile(profile: IUserDataProfile, exportFlags?: ProfileResourceTypeFlags): Promise<void>;
	createFromProfile(from: IUserDataProfile, options: IUserDataProfileCreateOptions, token: CancellationToken): Promise<IUserDataProfile | undefined>;
	createProfileFromTemplate(profileTemplate: IUserDataProfileTemplate, options: IUserDataProfileCreateOptions, token: CancellationToken): Promise<IUserDataProfile | undefined>;
	createTroubleshootProfile(): Promise<void>;
}

export interface IProfileResourceInitializer {
	initialize(content: string): Promise<void>;
}

export interface IProfileResource {
	getContent(profile: IUserDataProfile): Promise<string>;
	apply(content: string, profile: IUserDataProfile): Promise<void>;
}

export interface IProfileResourceTreeItem extends ITreeItem {
	readonly type: ProfileResourceType;
	readonly label: ITreeItemLabel;
	isFromDefaultProfile(): boolean;
	getChildren(): Promise<IProfileResourceChildTreeItem[] | undefined>;
	getContent(): Promise<string>;
}

export interface IProfileResourceChildTreeItem extends ITreeItem {
	parent: IProfileResourceTreeItem;
}

export interface ISaveProfileResult {
	readonly id: string;
	readonly link: URI;
}

export interface IUserDataProfileContentHandler {
	readonly name: string;
	readonly description?: string;
	readonly extensionId?: string;
	saveProfile(name: string, content: string, token: CancellationToken): Promise<ISaveProfileResult | null>;
	readProfile(idOrUri: string | URI, token: CancellationToken): Promise<string | null>;
}

export const defaultUserDataProfileIcon = registerIcon('defaultProfile-icon', Codicon.settings, localize('defaultProfileIcon', 'Icon for Default Profile.'));

export const PROFILES_TITLE = localize2('profiles', 'Profiles');
export const PROFILES_CATEGORY = { ...PROFILES_TITLE };
export const PROFILE_EXTENSION = 'code-profile';
export const PROFILE_FILTER = [{ name: localize('profile', "Profile"), extensions: [PROFILE_EXTENSION] }];
export const PROFILES_ENABLEMENT_CONTEXT = new RawContextKey<boolean>('profiles.enabled', true);
export const CURRENT_PROFILE_CONTEXT = new RawContextKey<string>('currentProfile', '');
export const IS_CURRENT_PROFILE_TRANSIENT_CONTEXT = new RawContextKey<boolean>('isCurrentProfileTransient', false);
export const HAS_PROFILES_CONTEXT = new RawContextKey<boolean>('hasProfiles', false);