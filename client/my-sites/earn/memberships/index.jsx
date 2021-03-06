/** @format */

/**
 * External dependencies
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { get, orderBy } from 'lodash';
import formatCurrency from '@automattic/format-currency';
import { saveAs } from 'browser-filesaver';

/**
 * Internal dependencies
 */
import { getSelectedSite, getSelectedSiteId, getSelectedSiteSlug } from 'state/ui/selectors';
import { isJetpackSite, isJetpackMinimumVersion } from 'state/sites/selectors';
import Card from 'components/card';
import InfiniteScroll from 'components/infinite-scroll';
import QueryMembershipsEarnings from 'components/data/query-memberships-earnings';
import QueryMembershipsSettings from 'components/data/query-memberships-settings';
import { requestSubscribers } from 'state/memberships/subscribers/actions';
import { decodeEntities } from 'lib/formatting';
import Gravatar from 'components/gravatar';
import Button from 'components/button';
import StripeConnectButton from 'components/stripe-connect-button';
import isSiteOnPaidPlan from 'state/selectors/is-site-on-paid-plan';
import UpgradeNudge from 'blocks/upgrade-nudge';
import { FEATURE_MEMBERSHIPS, PLAN_PERSONAL, PLAN_JETPACK_PERSONAL } from 'lib/plans/constants';
import Notice from 'components/notice';
import NoticeAction from 'components/notice/notice-action';
import SectionHeader from 'components/section-header';
import QueryMembershipProducts from 'components/data/query-memberships';
import CompactCard from 'components/card/compact';
import Gridicon from 'components/gridicon';
import { userCan } from 'lib/site/utils';

/**
 * Style dependencies
 */
import './style.scss';

class MembershipsSection extends Component {
	constructor( props ) {
		super( props );
		this.downloadSubscriberList = this.downloadSubscriberList.bind( this );
	}
	componentDidMount() {
		this.fetchNextSubscriberPage( false, true );
	}
	componentDidUpdate( prevProps ) {
		if ( prevProps.siteId !== this.props.siteId ) {
			// Site Id changed
			this.fetchNextSubscriberPage( false, true );
		}
	}
	renderEarnings() {
		const { translate } = this.props;
		return (
			<div>
				<SectionHeader label={ this.props.translate( 'Earnings' ) } />
				<QueryMembershipsEarnings siteId={ this.props.siteId } />
				<Card>
					<div className="memberships__module-content module-content">
						<ul className="memberships__earnings-breakdown-list">
							<li className="memberships__earnings-breakdown-item">
								<span className="memberships__earnings-breakdown-label">
									{ translate( 'Total earnings', { context: 'Sum of earnings' } ) }
								</span>
								<span className="memberships__earnings-breakdown-value">
									{ formatCurrency( this.props.total, this.props.currency ) }
								</span>
							</li>
							<li className="memberships__earnings-breakdown-item">
								<span className="memberships__earnings-breakdown-label">
									{ translate( 'Last 30 days', { context: 'Sum of earnings over last 30 days' } ) }
								</span>
								<span className="memberships__earnings-breakdown-value">
									{ formatCurrency( this.props.lastMonth, this.props.currency ) }
								</span>
							</li>
							<li className="memberships__earnings-breakdown-item">
								<span className="memberships__earnings-breakdown-label">
									{ translate( 'Next month', {
										context: 'Forecast for the subscriptions due in the next 30 days',
									} ) }
								</span>
								<span className="memberships__earnings-breakdown-value">
									{ formatCurrency( this.props.forecast, this.props.currency ) }
								</span>
							</li>
						</ul>
					</div>
					<div className="memberships__earnings-breakdown-notes">
						{ translate(
							'On your current plan, WordPress.com charges {{em}}%(commission)s{{/em}}.{{br/}} Stripe charges are typically %(stripe)s.',
							{
								args: {
									commission: '' + parseFloat( this.props.commission ) * 100 + '%',
									stripe: '2.9%+30c',
								},
								components: { em: <em />, br: <br /> },
							}
						) }
					</div>
				</Card>
			</div>
		);
	}

	fetchNextSubscriberPage( triggeredByInteraction, force ) {
		const fetched = Object.keys( this.props.subscribers ).length;
		if ( fetched < this.props.totalSubscribers || force ) {
			this.props.requestSubscribers( this.props.siteId, fetched );
		}
	}

	downloadSubscriberList( event ) {
		event.preventDefault();
		const fileName = [ this.props.siteSlug, 'memberships', 'subscribers' ].join( '_' ) + '.csv';

		const csvData = [
			[
				'ID',
				'status',
				'start_date',
				'end_date',
				'user_name',
				'user_email',
				'plan_id',
				'plan_title',
				'renewal_price',
				'currency',
				'renew_interval',
			].join( ',' ),
		]
			.concat(
				Object.values( this.props.subscribers ).map( row =>
					[
						row.id,
						row.status,
						row.start_date,
						row.end_date,
						row.user.name,
						row.user.user_email,
						row.plan.connected_account_product_id,
						row.plan.title,
						row.plan.renewal_price,
						row.plan.currency,
						row.renew_interval,
					].join( ',' )
				)
			)
			.join( '\n' );

		const blob = new Blob( [ csvData ], { type: 'text/csv;charset=utf-8' } );

		saveAs( blob, fileName );
	}

	renderSubscriberList() {
		return (
			<div>
				<SectionHeader label={ this.props.translate( 'Subscribers' ) } />
				{ Object.values( this.props.subscribers ).length === 0 && (
					<Card>
						{ this.props.translate(
							"You haven't added any subscribers. {{a}}Learn more{{/a}} about recurring payments.",
							{
								components: {
									a: (
										<a
											href="https://en.support.wordpress.com/recurring-payments-button/"
											target="_blank"
											rel="noreferrer noopener"
										/>
									),
								},
							}
						) }
					</Card>
				) }
				{ Object.values( this.props.subscribers ).length > 0 && (
					<Card>
						<div className="memberships__module-content module-content">
							<div>
								{ orderBy( Object.values( this.props.subscribers ), [ 'id' ], [ 'desc' ] ).map(
									sub => this.renderSubscriber( sub )
								) }
							</div>
							<InfiniteScroll
								nextPageMethod={ triggeredByInteraction =>
									this.fetchNextSubscriberPage( triggeredByInteraction, false )
								}
							/>
						</div>
						<div className="memberships__module-footer">
							<Button onClick={ this.downloadSubscriberList }>
								{ this.props.translate( 'Download list as CSV' ) }
							</Button>
						</div>
					</Card>
				) }
			</div>
		);
	}

	renderProducts() {
		return (
			<div>
				<SectionHeader label={ this.props.translate( 'Settings' ) } />
				<CompactCard href={ '/earn/payments-plans/' + this.props.siteSlug }>
					<QueryMembershipProducts siteId={ this.props.siteId } />
					<div className="memberships__module-products-title">
						{ this.props.translate( 'Recurring Payments plans' ) }
					</div>
					<div className="memberships__module-products-list">
						<Gridicon icon="tag" size={ 12 } className="memberships__module-products-list-icon" />
						{ this.props.products
							.map( product => formatCurrency( product.price, product.currency ) )
							.join( ', ' ) }
					</div>
				</CompactCard>
			</div>
		);
	}

	renderSubscriberSubscriptionSummary( subscriber ) {
		if ( subscriber.plan.renew_interval === 'one-time' ) {
			return this.props.translate( 'Paid %(amount)s once on %(formattedDate)s', {
				args: {
					amount: formatCurrency( subscriber.plan.renewal_price, subscriber.plan.currency ),
					formattedDate: this.props.moment( subscriber.start_date ).format( 'll' ),
				},
			} );
		} else if ( subscriber.plan.renew_interval === '1 year' ) {
			return this.props.translate( 'Paying %(amount)s/year since %(formattedDate)s', {
				args: {
					amount: formatCurrency( subscriber.plan.renewal_price, subscriber.plan.currency ),
					formattedDate: this.props.moment( subscriber.start_date ).format( 'll' ),
				},
			} );
		} else if ( subscriber.plan.renew_interval === '1 month' ) {
			return this.props.translate( 'Paying %(amount)s/month since %(formattedDate)s', {
				args: {
					amount: formatCurrency( subscriber.plan.renewal_price, subscriber.plan.currency ),
					formattedDate: this.props.moment( subscriber.start_date ).format( 'll' ),
				},
			} );
		}
	}

	renderSubscriber( subscriber ) {
		return (
			<Card className="memberships__subscriber-profile is-compact" key={ subscriber.id }>
				<div className="memberships__subscriber-gravatar">
					<Gravatar user={ subscriber.user } size={ 72 } />
				</div>
				<div className="memberships__subscriber-detail">
					<div className="memberships__subscriber-username">
						{ decodeEntities( subscriber.user.name ) }
					</div>
					<div className="memberships__subscriber-email" data-e2e-login={ subscriber.user_email }>
						<span>{ subscriber.user.user_email }</span>
					</div>
					<div className="memberships__subscriber-subscribed">
						{ this.renderSubscriberSubscriptionSummary( subscriber ) }
					</div>
				</div>
			</Card>
		);
	}

	renderStripeConnected() {
		return (
			<div>
				{ this.renderEarnings() }
				{ this.renderSubscriberList() }
				{ this.renderProducts() }
			</div>
		);
	}

	renderOnboarding() {
		return (
			<div>
				<SectionHeader label={ this.props.translate( 'About Recurring Payments' ) } />
				<Card>
					<div className="memberships__module-content module-content">
						<p>
							{ this.props.translate(
								'Start collecting subscription payments! Recurring Payments is a feature inside the block editor. When editing a post or a page you can insert a button that will allow you to collect paying subscribers.'
							) }
						</p>
					</div>
				</Card>
				<Notice
					text={ this.props.translate( 'Read more about the Recurring Payments feature.' ) }
					showDismiss={ false }
				>
					<NoticeAction
						href={ `https://support.wordpress.com/recurring-payments-button/` }
						icon="external"
					/>
				</Notice>
			</div>
		);
	}

	renderConnectStripe() {
		return (
			<div>
				{ this.props.query.stripe_connect_cancelled && (
					<Notice
						showDismiss={ false }
						text={ this.props.translate(
							'The attempt to connect to Stripe has been cancelled. You can connect again at any time.'
						) }
					/>
				) }
				{ this.renderOnboarding() }
				<SectionHeader label={ this.props.translate( 'Stripe Connection' ) } />
				<Card>
					<div className="memberships__module-content module-content">
						<p>
							{ this.props.translate(
								'Recurring payments are processed through Stripe. Click the button below to create a new account or to connect an existing Stripe account.'
							) }
						</p>
						<StripeConnectButton href={ this.props.connectUrl } target="_blank">
							{ this.props.translate( 'Connect with Stripe' ) }
						</StripeConnectButton>
					</div>
				</Card>
			</div>
		);
	}

	render() {
		if ( this.props.isJetpackTooOld ) {
			return (
				<div>
					{ this.renderOnboarding() }
					<Notice
						status="is-warning"
						text={ this.props.translate(
							'Please update the Jetpack plugin to version 7.4 or higher in order to use the Recurring Payments button block.'
						) }
						showDismiss={ false }
					>
						<NoticeAction
							href={ `https://wordpress.com/plugins/jetpack/${ this.props.siteSlug }` }
							icon="external"
						/>
					</Notice>
				</div>
			);
		}

		if ( ! this.props.paidPlan ) {
			return (
				<div>
					{ this.renderOnboarding() }
					<UpgradeNudge
						plan={ this.props.isJetpack ? PLAN_JETPACK_PERSONAL : PLAN_PERSONAL }
						shouldDisplay={ () => true }
						feature={ FEATURE_MEMBERSHIPS }
						title={ this.props.translate( 'Upgrade to the Personal plan' ) }
						message={ this.props.translate( 'Upgrade to start earning recurring revenue.' ) }
					/>
				</div>
			);
		}

		if ( ! userCan( 'manage_options', this.props.site ) ) {
			return (
				<div>
					{ this.renderOnboarding() }
					<Notice
						status="is-warning"
						text={ this.props.translate(
							'Only site administrators can edit Recurring Payments settings.'
						) }
						showDismiss={ false }
					/>
				</div>
			);
		}

		return (
			<div>
				<QueryMembershipsSettings siteId={ this.props.siteId } />
				{ this.props.connectedAccountId && this.renderStripeConnected() }
				{ this.props.connectUrl && ! this.props.connectedAccountId && this.renderConnectStripe() }
			</div>
		);
	}
}

const mapStateToProps = state => {
	const site = getSelectedSite( state );
	const siteId = getSelectedSiteId( state );
	const isJetpack = isJetpackSite( state, siteId );
	return {
		site,
		siteId,
		siteSlug: getSelectedSiteSlug( state ),
		total: get( state, [ 'memberships', 'earnings', 'summary', siteId, 'total' ], 0 ),
		lastMonth: get( state, [ 'memberships', 'earnings', 'summary', siteId, 'last_month' ], 0 ),
		forecast: get( state, [ 'memberships', 'earnings', 'summary', siteId, 'forecast' ], 0 ),
		currency: get( state, [ 'memberships', 'earnings', 'summary', siteId, 'currency' ], 'USD' ),
		commission: get( state, [ 'memberships', 'earnings', 'summary', siteId, 'commission' ], '0.1' ),
		totalSubscribers: get( state, [ 'memberships', 'subscribers', 'list', siteId, 'total' ], 0 ),
		subscribers: get( state, [ 'memberships', 'subscribers', 'list', siteId, 'ownerships' ], {} ),
		connectedAccountId: get(
			state,
			[ 'memberships', 'settings', siteId, 'connectedAccountId' ],
			null
		),
		connectUrl: get( state, [ 'memberships', 'settings', siteId, 'connectUrl' ], '' ),
		paidPlan: isSiteOnPaidPlan( state, siteId ),
		isJetpackTooOld: isJetpack && isJetpackMinimumVersion( state, siteId, '7.4' ) === false,
		isJetpack: isJetpack,
		products: get( state, [ 'memberships', 'productList', 'items', siteId ], [] ),
	};
};

export default connect(
	mapStateToProps,
	{ requestSubscribers }
)( localize( MembershipsSection ) );
