from __future__ import absolute_import

import six

from django.core.urlresolvers import reverse

from sentry.discover.models import KeyTransaction, MAX_KEY_TRANSACTIONS
from sentry.utils.samples import load_data
from sentry.testutils import APITestCase


class KeyTransactionTest(APITestCase):
    def setUp(self):
        super(KeyTransactionTest, self).setUp()

        self.login_as(user=self.user, superuser=False)

        self.org = self.create_organization(owner=self.user, name="foo")

        self.project = self.create_project(name="bar", organization=self.org)

    def test_save_key_transaction(self):
        data = load_data("transaction")
        with self.feature("organizations:discover"):
            url = reverse("sentry-api-0-organization-key-transactions", args=[self.org.slug])
            response = self.client.post(
                url, {"transaction": data["transaction"], "project": self.project.id}
            )

        assert response.status_code == 201

        key_transactions = KeyTransaction.objects.filter(owner=self.user)
        assert len(key_transactions) == 1

        key_transaction = key_transactions.first()
        assert key_transaction.transaction == data["transaction"]
        assert key_transaction.organization == self.org

    def test_duplicate_key_transaction(self):
        data = load_data("transaction")
        with self.feature("organizations:discover"):
            url = reverse("sentry-api-0-organization-key-transactions", args=[self.org.slug])
            response = self.client.post(
                url, {"transaction": data["transaction"], "project": self.project.id}
            )
            assert response.status_code == 201

            response = self.client.post(
                url, {"transaction": data["transaction"], "project": self.project.id}
            )
            assert response.status_code == 400

        key_transactions = KeyTransaction.objects.filter(owner=self.user)
        assert len(key_transactions) == 1

        key_transaction = key_transactions.first()
        assert key_transaction.transaction == data["transaction"]
        assert key_transaction.organization == self.org

    def test_save_with_wrong_project(self):
        other_user = self.create_user()
        other_org = self.create_organization(owner=other_user)
        other_project = self.create_project(organization=other_org)

        data = load_data("transaction")
        with self.feature("organizations:discover"):
            url = reverse("sentry-api-0-organization-key-transactions", args=[self.org.slug])
            response = self.client.post(
                url, {"transaction": data["transaction"], "project": other_project.id}
            )

        assert response.status_code == 400
        assert response.data["detail"] == "No project with that id found"

    def test_max_key_transaction(self):
        data = load_data("transaction")
        for i in range(MAX_KEY_TRANSACTIONS):
            KeyTransaction.objects.create(
                owner=self.user,
                organization=self.org,
                transaction=data["transaction"] + six.text_type(i),
                project=self.project,
            )
        with self.feature("organizations:discover"):
            url = reverse("sentry-api-0-organization-key-transactions", args=[self.org.slug])
            response = self.client.post(
                url, {"transaction": data["transaction"], "project": self.project.id}
            )

        assert response.status_code == 400
        assert response.data["detail"] == "At most {} Key Transactions can be added".format(
            MAX_KEY_TRANSACTIONS
        )

    def test_get_key_transactions(self):
        project2 = self.create_project(name="foo", organization=self.org)
        event_data = load_data("transaction")

        transactions = [
            (self.project, "/foo_transaction/"),
            (self.project, "/blah_transaction/"),
            (self.project, "/zoo_transaction/"),
            (project2, "/bar_transaction/"),
        ]

        for project, transaction in transactions:
            event_data["transaction"] = transaction
            self.store_event(data=event_data, project_id=project.id)
            KeyTransaction.objects.create(
                owner=self.user,
                organization=self.org,
                transaction=event_data["transaction"],
                project=project,
            )

        with self.feature("organizations:discover"):
            url = reverse("sentry-api-0-organization-key-transactions", args=[self.org.slug])
            response = self.client.get(
                url,
                {
                    "project": [self.project.id, project2.id],
                    "orderby": "transaction",
                    "field": [
                        "transaction",
                        "transaction_status",
                        "project",
                        "rpm()",
                        "error_rate()",
                        "p95()",
                    ],
                },
            )

        assert response.status_code == 200
        data = response.data["data"]
        assert len(data) == 4
        assert [item["transaction"] for item in data] == [
            "/bar_transaction/",
            "/blah_transaction/",
            "/foo_transaction/",
            "/zoo_transaction/",
        ]

    def test_delete_transaction(self):
        event_data = load_data("transaction")

        KeyTransaction.objects.create(
            owner=self.user,
            organization=self.org,
            transaction=event_data["transaction"],
            project=self.project,
        )
        with self.feature("organizations:discover"):
            url = reverse("sentry-api-0-organization-key-transactions", args=[self.org.slug])
            response = self.client.delete(
                url, {"transaction": event_data["transaction"], "project": self.project.id}
            )

        assert response.status_code == 204
        assert (
            KeyTransaction.objects.filter(
                owner=self.user,
                organization=self.org,
                transaction=event_data["transaction"],
                project=self.project,
            ).count()
            == 0
        )

    def test_create_after_deleting_tenth_transaction(self):
        data = load_data("transaction")
        for i in range(MAX_KEY_TRANSACTIONS):
            KeyTransaction.objects.create(
                owner=self.user,
                organization=self.org,
                transaction=data["transaction"] + six.text_type(i),
                project=self.project,
            )

        with self.feature("organizations:discover"):
            url = reverse("sentry-api-0-organization-key-transactions", args=[self.org.slug])
            response = self.client.delete(
                url, {"transaction": data["transaction"] + "0", "project": self.project.id}
            )
            assert response.status_code == 204

            response = self.client.post(
                url, {"transaction": data["transaction"], "project": self.project.id}
            )
            assert response.status_code == 201
