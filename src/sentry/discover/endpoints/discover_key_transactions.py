from __future__ import absolute_import

from rest_framework.response import Response

from sentry import features
from sentry.api.bases import OrganizationEventsV2EndpointBase
from sentry.models import Project, ProjectStatus
from sentry.api.bases.organization import OrganizationPermission
from sentry.api.exceptions import ResourceDoesNotExist
from sentry.discover.models import KeyTransaction, MAX_KEY_TRANSACTIONS
from sentry.snuba.discover import query


class KeyTransactionEndpoint(OrganizationEventsV2EndpointBase):
    permission_classes = (OrganizationPermission,)

    def has_feature(self, request, organization):
        return features.has("organizations:discover", organization, actor=request.user)

    def get_project(self, organization, project_id):
        """ Get a project for an org, or None if one doesn't exist """
        return Project.objects.filter(
            organization=organization, status=ProjectStatus.VISIBLE, id=project_id
        ).first()

    def post(self, request, organization):
        """ Create A Key Transaction """
        if not self.has_feature(request, organization):
            return self.response(status=404)

        project = self.get_project(organization, int(request.data["project"]))

        if project is None:
            return Response({"detail": "No project with that id found"}, status=400)

        base_filter = {"organization": organization, "project": project, "owner": request.user}

        # Limit the number of key transactions
        if KeyTransaction.objects.filter(**base_filter).count() >= MAX_KEY_TRANSACTIONS:
            return Response(
                {"detail": "At most {} Key Transactions can be added".format(MAX_KEY_TRANSACTIONS)},
                status=400,
            )

        base_filter["transaction"] = request.data["transaction"]
        if KeyTransaction.objects.filter(**base_filter).count() == 1:
            return Response({"detail": "This Key Transaction was already added"}, status=400)

        KeyTransaction.objects.create(**base_filter)
        return Response(status=201)

    def get(self, request, organization):
        """ Get the paged Key Transactions for a user """
        if not self.has_feature(request, organization):
            return self.response(status=404)

        params = self.get_filter_params(request, organization)
        fields = request.GET.getlist("field")[:]
        orderby = self.get_orderby(request)

        queryset = KeyTransaction.objects.filter(organization=organization, owner=request.user)

        results = query(
            fields,
            None,
            params,
            orderby=orderby,
            referrer="discover.key_transactions",
            # The snuba query for transactions is of the form
            # (transaction="1" AND project=1) OR (transaction="2" and project=2) ...
            # which the schema intentionally doesn't support so we cannot do an AND in OR
            # so here the "and" operator is being instead to do an AND in OR query
            conditions=[
                [
                    # First layer is Ands
                    [
                        # Second layer is Ors
                        [
                            "and",
                            [
                                [
                                    "equals",
                                    ["transaction", u"'{}'".format(transaction.transaction)],
                                ],
                                ["equals", ["project_id", transaction.project.id]],
                            ],
                        ],
                        "=",
                        1,
                    ]
                    for transaction in queryset
                ]
            ],
        )

        return Response(
            self.handle_results_with_meta(request, organization, params["project_id"], results),
            status=200,
        )

    def delete(self, request, organization):
        """ Remove a Key transaction for a user """
        if not self.has_feature(request, organization):
            return self.response(status=404)

        project = self.get_project(organization, int(request.data["project"]))
        transaction = request.data["transaction"]

        try:
            model = KeyTransaction.objects.get(
                transaction=transaction, organization=organization, project=project
            )
        except KeyTransaction.DoesNotExist:
            raise ResourceDoesNotExist

        model.delete()

        return Response(status=204)
