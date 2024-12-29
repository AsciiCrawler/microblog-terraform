resource "random_id" "default" {
  byte_length = 4
  keepers = {
    key          = var.key_data.key
    project_name = var.key_data.project_name
  }
}
resource "aws_secretsmanager_secret" "default" {
  name = "${var.key_data.project_name}-${var.key_data.key}-${random_id.default.hex}"
}

resource "aws_secretsmanager_secret_version" "default" {
  secret_id     = aws_secretsmanager_secret.default.id
  secret_string = var.secret
}

resource "aws_iam_policy" "default" {
  name        = "${var.key_data.key}-${random_id.default.hex}"
  description = "IAM policy to allow access to the secret"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["secretsmanager:GetSecretValue"],
        Effect   = "Allow",
        Resource = aws_secretsmanager_secret.default.arn
      }
    ]
  })
}

